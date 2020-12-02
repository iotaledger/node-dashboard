export interface IPeerInfo {
    address: string;
    port: number;
    domain: string;
    numberOfAllTransactions: number;
    numberOfNewTransactions: number;
    numberOfKnownTransactions: number;
    numberOfReceivedTransactionReq: number;
    numberOfReceivedMilestoneReq: number;
    numberOfReceivedHeartbeats: number;
    numberOfSentTransactions: number;
    numberOfSentTransactionsReq: number;
    numberOfSentMilestoneReq: number;
    numberOfSentHeartbeats: number;
    numberOfDroppedSentPackets: number;
    connectionType: string;
    autopeeringId: string;
    connected: boolean;
}
