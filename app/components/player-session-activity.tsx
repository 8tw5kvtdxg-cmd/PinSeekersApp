"use client";

import { useEffect } from "react";

const inactivityDurationMs = 60 * 60 * 1000;
const renewalIntervalMs = 5 * 60 * 1000;
const activityStorageKey = "pin2win-player-last-activity";
export const playerSessionStartedEvent = "pin2win:player-session-started";

export function PlayerSessionActivity() {
  useEffect(() => {
    let hasActiveSession = false;
    let lastRenewedAt = 0;
    let logoutTimer: number | undefined;

    function getLastActivityAt() {
      const value = Number(window.localStorage.getItem(activityStorageKey));

      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function scheduleLogout() {
      window.clearTimeout(logoutTimer);

      if (!hasActiveSession) {
        return;
      }

      const remaining = Math.max(
        0,
        inactivityDurationMs - (Date.now() - getLastActivityAt()),
      );

      logoutTimer = window.setTimeout(() => {
        if (Date.now() - getLastActivityAt() < inactivityDurationMs) {
          scheduleLogout();
          return;
        }

        hasActiveSession = false;
        window.localStorage.removeItem(activityStorageKey);
        void fetch("/api/account/logout", { method: "POST" }).finally(() => {
          window.location.replace("/account#login");
        });
      }, remaining);
    }

    async function renewSession(force = false) {
      if (
        !hasActiveSession ||
        (!force && Date.now() - lastRenewedAt < renewalIntervalMs)
      ) {
        return;
      }

      const response = await fetch("/api/account/session/activity", {
        cache: "no-store",
        method: "POST",
      }).catch(() => null);

      if (response?.ok) {
        lastRenewedAt = Date.now();
      } else if (response?.status === 401) {
        hasActiveSession = false;
        window.localStorage.removeItem(activityStorageKey);
        window.clearTimeout(logoutTimer);
        window.location.replace("/account#login");
      }
    }

    function recordActivity() {
      if (!hasActiveSession) {
        return;
      }

      window.localStorage.setItem(activityStorageKey, String(Date.now()));
      scheduleLogout();
      void renewSession();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === activityStorageKey && event.newValue) {
        scheduleLogout();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        recordActivity();
      }
    }

    function handleSessionStarted() {
      hasActiveSession = true;
      lastRenewedAt = 0;
      window.localStorage.setItem(activityStorageKey, String(Date.now()));
      scheduleLogout();
      void renewSession(true);
    }

    async function initialize() {
      const response = await fetch("/api/account/session/activity", {
        cache: "no-store",
        method: "GET",
      }).catch(() => null);

      if (!response?.ok) {
        window.localStorage.removeItem(activityStorageKey);
        return;
      }

      hasActiveSession = true;
      const lastActivityAt = getLastActivityAt();

      if (lastActivityAt && Date.now() - lastActivityAt >= inactivityDurationMs) {
        window.localStorage.removeItem(activityStorageKey);
        await fetch("/api/account/logout", { method: "POST" }).catch(() => null);
        window.location.replace("/account#login");
        return;
      }

      window.localStorage.setItem(activityStorageKey, String(Date.now()));
      scheduleLogout();
      await renewSession(true);
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener("storage", handleStorage);
    window.addEventListener(playerSessionStartedEvent, handleSessionStarted);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void initialize();

    return () => {
      window.clearTimeout(logoutTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(playerSessionStartedEvent, handleSessionStarted);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
