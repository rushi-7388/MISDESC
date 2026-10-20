import { useEffect, useState, useRef } from "react";
import { playNotificationChime } from "../utils/sound.util";

export function useClearingEvents(onEvent) {
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    function connect() {
      try {
        eventSource = new EventSource("/api/events");

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.addEventListener("CONNECTED", () => {
          setConnected(true);
        });

        const handleIncoming = (type, e, chimeType = null) => {
          try {
            const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
            const eventPayload = { type, data, timestamp: new Date().toISOString() };
            setLastEvent(eventPayload);
            if (chimeType) playNotificationChime(chimeType);
            onEventRef.current?.(eventPayload);
          } catch {
            // Ignore parse errors on ping/keep-alive frames
          }
        };

        // Standard CTS Clearing Events
        eventSource.addEventListener("CHEQUE_PRESENTED", (e) => handleIncoming("PRESENTED", e, "presentation"));
        eventSource.addEventListener("CHEQUE_VERIFIED", (e) => handleIncoming("VERIFIED", e));
        eventSource.addEventListener("CHEQUE_AWAITING_CHECKER", (e) => handleIncoming("AWAITING_CHECKER", e));
        eventSource.addEventListener("CHEQUE_CLEARED", (e) => handleIncoming("CLEARED", e, "cleared"));
        eventSource.addEventListener("CHEQUE_RETURNED", (e) => handleIncoming("RETURNED", e));
        eventSource.addEventListener("CHEQUE_TRANSITIONED", (e) => handleIncoming("TRANSITIONED", e));
        eventSource.addEventListener("SETTLEMENT_RUN", (e) => handleIncoming("SETTLEMENT", e, "cleared"));

        // Next-Gen Sovereign Events
        eventSource.addEventListener("ACOUSTIC_VOUCHER_GENERATED", (e) => handleIncoming("ACOUSTIC_VOUCHER", e));
        eventSource.addEventListener("LIQUIDITY_SWARM_OPTIMIZED", (e) => handleIncoming("LIQUIDITY_SWARM", e));
        eventSource.addEventListener("VOICE_LIVENESS_INSPECTED", (e) => handleIncoming("VOICE_LIVENESS", e));
        eventSource.addEventListener("CBDC_TAX_SPLIT_EXECUTED", (e) => handleIncoming("CBDC_TAX_SPLIT", e));
        eventSource.addEventListener("BILATERAL_DVP_SETTLED", (e) => handleIncoming("BILATERAL_DVP", e));

        // 2025 RBI & Digital Public Infrastructure (DPI) Events
        eventSource.addEventListener("HOURLY_BATCH_SETTLED", (e) => handleIncoming("HOURLY_BATCH_SETTLED", e, "cleared"));
        eventSource.addEventListener("MULE_ALERT_TRIGGERED", (e) => handleIncoming("MULE_ALERT_TRIGGERED", e));
        eventSource.addEventListener("NESL_NOTICE_SEALED", (e) => handleIncoming("NESL_NOTICE_SEALED", e));
        eventSource.addEventListener("ULI_JIT_OD_DISBURSED", (e) => handleIncoming("ULI_JIT_OD_DISBURSED", e));
        eventSource.addEventListener("BHASHINI_VOICE_AUTHENTICATED", (e) => handleIncoming("BHASHINI_VOICE_AUTHENTICATED", e));
        eventSource.addEventListener("SRVA_VOSTRO_SETTLED", (e) => handleIncoming("SRVA_VOSTRO_SETTLED", e, "cleared"));

        eventSource.onmessage = (e) => {
          handleIncoming("GENERIC_EVENT", e);
        };

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Retry connection after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);

  return { lastEvent, connected };
}
