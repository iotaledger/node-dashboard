/* eslint-disable camelcase */
export interface IStatus {
    snapshot_index: number;
    pruning_index: number;
    is_healthy: boolean;
    is_synced: boolean;
    version: string;
    latest_version: string;
    uptime: number;
    autopeering_id: string;
    node_alias: string;
    bech32_hrp: string;
    connected_peers_count: number;
    current_requested_ms: number;
    request_queue_queued: number;
    request_queue_pending: number;
    request_queue_processing: number;
    request_queue_avg_latency: number;
    server_metrics: {
        all_msgs: number;
        new_msgs: number;
        known_msgs: number;
        invalid_msgs: number;
        invalid_req: number;
        rec_msg_req: number;
        rec_ms_req: number;
        rec_heartbeat: number;
        sent_msgs: number;
        sent_msg_req: number;
        sent_ms_req: number;
        sent_heartbeat: number;
        dropped_sent_packets: number;
        sent_spam_messages: number;
        validated_messages: number;
    };
    mem: {
        sys: number;
        heap_sys: number;
        heap_inuse: number;
        heap_idle: number;
        heap_released: number;
        heap_objects: number;
        m_span_inuse: number;
        m_cache_inuse: number;
        stack_sys: number;
        num_gc: number;
        last_pause_gc: number;
    };
    caches: {
        request_queue: {
            size: number;
        };
        children: {
            size: number;
        };
        milestones: {
            size: number;
        };
        messages: {
            size: number;
        };
        incoming_message_work_units: {
            size: number;
        };
    };
}
