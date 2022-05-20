/* eslint-disable max-len */
import { Ed25519Address, IReferenceUnlock, ISignatureUnlock, UTXO_INPUT_TYPE, REFERENCE_UNLOCK_TYPE, SIGNATURE_UNLOCK_TYPE, ALIAS_UNLOCK_TYPE, NFT_UNLOCK_TYPE, serializeTransactionPayload, AddressTypes, IEd25519Address, ED25519_ADDRESS_TYPE  } from "@iota/iota.js";
import { Blake2b } from "@iota/crypto.js";
import { Converter, WriteStream } from "@iota/util.js";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { NodeConfigService } from "../../../services/nodeConfigService";
import Output from "./Output";
import { TransactionPayloadProps } from "./TransactionPayloadProps";
import { TransactionPayloadState } from "./TransactionPayloadState";
import UTXOInput from "./UTXOInput";

/**
 * Component which will display a transaction payload.
 */
class TransactionPayload extends Component<TransactionPayloadProps, TransactionPayloadState> {
    /**
     * The bech32 hrp from the node.
     */
    private readonly _bech32Hrp: string;

    /**
     * Create a new instance of TransactionPayload.
     * @param props The props.
     */
    constructor(props: TransactionPayloadProps) {
        super(props);

        const nodeConfigService = ServiceFactory.get<NodeConfigService>("node-config");
        this._bech32Hrp = nodeConfigService.getBech32Hrp();

        const signatureBlocks: ISignatureUnlock[] = [];
        for (let i = 0; i < props.payload.unlocks.length; i++) {
            if (props.payload.unlocks[i].type === SIGNATURE_UNLOCK_TYPE) {
                const sigUnlockBlock = props.payload.unlocks[i] as ISignatureUnlock;
                signatureBlocks.push(sigUnlockBlock);
            } else if (
                props.payload.unlocks[i].type === REFERENCE_UNLOCK_TYPE ||
                props.payload.unlocks[i].type === ALIAS_UNLOCK_TYPE ||
                props.payload.unlocks[i].type === NFT_UNLOCK_TYPE) {
                    const refUnlockBlock = props.payload.unlocks[i] as IReferenceUnlock;
                    signatureBlocks.push(props.payload.unlocks[refUnlockBlock.reference] as ISignatureUnlock);
            }
        }

        const unlockAddresses: AddressTypes[] = [];
        for (let i = 0; i < signatureBlocks.length; i++) {
            unlockAddresses.push({ pubKeyHash: Converter.bytesToHex(
                new Ed25519Address(Converter.hexToBytes(signatureBlocks[i].signature.publicKey))
                    .toAddress()
            ), type: ED25519_ADDRESS_TYPE } as IEd25519Address);
        }
        const writeStream = new WriteStream();

        try {
            serializeTransactionPayload(writeStream, this.props.payload);
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
        }

        const transactionId = Converter.bytesToHex(Blake2b.sum256(writeStream.finalBytes()), true);

        this.state = {
            unlockAddresses,
            transactionId
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="transaction-payload">
                <div className="card margin-t-m padding-l">
                    <div className="card--header">
                        <h2 className="card--header__title">Inputs</h2>
                        <span className="card--header-count">
                            {this.props.payload.essence.inputs.length}
                        </span>
                    </div>
                    {this.props.payload.essence.inputs.map((input, idx) => (
                        <React.Fragment key={idx}>
                            {input.type === UTXO_INPUT_TYPE && (
                                <UTXOInput
                                    key={idx}
                                    index={idx}
                                    unlockAddress={this.state.unlockAddresses[idx]}
                                    input={input}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="card margin-t-m padding-l">
                    <div className="card--header">
                        <h2 className="card--header__title">Outputs</h2>
                        <span className="card--header-count">
                            {this.props.payload.essence.outputs.length}
                        </span>
                    </div>
                    {this.props.payload.essence.outputs.map((output, idx) => (
                        <Output
                            key={idx}
                            index={idx + 1}
                            output={output}
                            outputId={this.state.transactionId +
                                    String(idx).padStart(2, "0")
                                            .padEnd(4, "0")}
                        />
                        )
                    )}
                </div>
            </div>
        );
    }
}

export default TransactionPayload;
