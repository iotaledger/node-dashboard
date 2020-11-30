import {action, computed, observable} from 'mobx';
import {registerHandler, WSMsgType} from "app/misc/WS";
import * as React from "react";
import {Link} from 'react-router-dom';
import {RouterStore} from "mobx-react-router";
import NodeStore from "app/stores/NodeStore";
import { IMessageMetadata, IMilestone } from "@iota/iota2.js";

class AddressResult {
    balance: number;
    msgsMeta: Array<IMessageMetadata>;
}

class IndexationResult {
    msgsMeta: Array<IMessageMetadata>;
}

class ConfirmedState {
    state: boolean;
    conflicting: boolean;
    milestone_index: number;
}

class SearchResult {
    msgMeta: IMessageMetadata;
    address: AddressResult;
    indexation: IndexationResult;
    milestone: IMilestone;
}

class Ms {
    index: number;
}

const liveFeedSize = 10;

enum QueryError {
    NotFound
}

export class ExplorerStore {
    // live feed
    @observable latest_mss: Array<Ms> = [];

    // queries
    @observable msgMeta: IMessageMetadata = null;
    @observable addr: AddressResult = null;
    @observable indexation: IndexationResult = null;

    // loading
    @observable query_loading: boolean = false;
    @observable query_err: any = null;

    // search
    @observable search: string = "";
    @observable search_result: SearchResult = null;
    @observable searching: boolean = false;

    @observable valueOnly: boolean = false;

    // formatting
    @observable shortenedValues: boolean = true;

    nodeStore: NodeStore;
    routerStore: RouterStore;

    constructor(nodeStore: NodeStore, routerStore: RouterStore) {
        this.nodeStore = nodeStore;
        this.routerStore = routerStore;

        this.registerHandlers();
    }

    registerHandlers = () => {
        registerHandler(WSMsgType.Ms, this.addLiveFeedMs);
    }

    searchAny = async () => {
        if (this.search === '420') {
            this.routerStore.push(`/explorer/420`);
            return;
        }
        this.updateSearching(true);
        try {
            let res = await fetch(`/api/search/${this.search}`);
            let result: SearchResult = await res.json();
            this.updateSearchResult(result);
        } catch (err) {
            this.updateQueryError(err);
        }
    };

    @action
    resetSearch = () => {
        this.search_result = null;
        this.searching = false;
    };

    @action
    updateSearchResult = (result: SearchResult) => {
        this.search_result = result;
        this.searching = false;
        let search = this.search;
        this.search = '';
        if (this.search_result.msgMeta) {
            this.routerStore.push(`/explorer/msgs/${search}`);
            return;
        }
        if (this.search_result.milestone) {
            this.routerStore.push(`/explorer/milestones/${this.search_result.milestone.milestoneIndex}`);
            return;
        }
        if (this.search_result.address) {
            this.routerStore.push(`/explorer/addresses/${search}`);
            return;
        }
        if (this.search_result.indexation) {
            this.routerStore.push(`/explorer/indexations/${search}`);
            return;
        }
        this.routerStore.push(`/explorer/404/${search}`);
    };

    @action
    updateSearch = (search: string) => {
        this.search = search;
    };

    @action
    updateSearching = (searching: boolean) => this.searching = searching;

    searchMsg = async (hash: string) => {
        this.updateQueryLoading(true);
        try {
            let res = await fetch(`/api/msgs/${hash}`);
            if (res.status === 404) {
                this.updateQueryError(QueryError.NotFound);
                return;
            }
            let msgMeta: IMessageMetadata = await res.json();
            /*
            try {
                // ToDo:
                try {
                    if (msg.ascii_message.includes('{') && msg.ascii_message.includes('}')) {
                        msg.json_obj = JSON.parse(msg.ascii_message)
                    }
                } catch (error) {

                }
            } catch (error) {
                console.log(error);
            }
            */
            this.updateMsg(msgMeta);
        } catch (err) {
            this.updateQueryError(err);
        }
    };

    searchAddress = async (hash: string) => {
        this.updateQueryLoading(true);
        try {
            let res = await fetch(`/api/addr/${hash}${this.valueOnly ? "/value" : ""}`);
            if (res.status === 404) {
                this.updateQueryError(QueryError.NotFound);
                return;
            }
            let addr: AddressResult = await res.json();
            this.updateAddress(addr);
        } catch (err) {
            this.updateQueryError(err);
        }
    };

    searchIndexation = async (hash: string) => {
        this.updateQueryLoading(true);
        try {
            let res = await fetch(`/api/indexation/${hash}`);
            if (res.status === 404) {
                this.updateQueryError(QueryError.NotFound);
                return;
            }
            let indexRes: IndexationResult = await res.json();
            this.updateIndexation(indexRes);
        } catch (error) {
            this.updateQueryError(error);
        }
    }

    @action
    reset = () => {
        this.msgMeta = null;
        this.query_err = null;
    };

    @action
    toggleValueOnly = () => {
        this.valueOnly = !this.valueOnly;
    };

    @action
    toggleValueFormat = () => {
        this.shortenedValues = !this.shortenedValues;
    };

    @action
    updateAddress = (addr: AddressResult) => {
        addr.msgsMeta = addr.msgsMeta.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1;
        });
        this.addr = addr;
        this.query_err = null;
        this.query_loading = false;
    };

    @action
    updateIndexation = (indexRes: IndexationResult) => {
        indexRes.msgsMeta = indexRes.msgsMeta.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1;
        });
        this.indexation = indexRes;
        this.query_err = null;
        this.query_loading = false;
    };

    @action
    updateMsg = (msgMeta: IMessageMetadata) => {
        this.msgMeta = msgMeta;
        this.query_err = null;
        this.query_loading = false;
    };

    @action
    updateQueryLoading = (loading: boolean) => this.query_loading = loading;

    @action
    updateQueryError = (err: any) => {
        this.query_err = err;
        this.query_loading = false;
        this.searching = false;
    };

    @action
    addLiveFeedMs = (ms: Ms) => {
        if (this.latest_mss.length >= liveFeedSize) {
            this.latest_mss.pop();
        }
        this.latest_mss.unshift(ms);
    };

    @computed
    get mssLiveFeed() {
        let feed = [];
        for (let i = 0; i < this.latest_mss.length; i++) {
            let ms = this.latest_mss[i];
            feed.push(
                <tr key={ms.index}>
                    <td>
                        <Link to={`/explorer/milestones/${ms.index}`}>
                            {ms.index}
                        </Link>
                    </td>
                </tr>
            );
        }
        return feed;
    }

}

export default ExplorerStore;