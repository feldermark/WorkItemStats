import WITClient = require("TFS/WorkItemTracking/RestClient");
import Models = require("TFS/WorkItemTracking/Contracts");
import Q = require("q");
import { StatusIndicator } from "VSS/Controls/StatusIndicator";
import { validateGroup } from "VSS/Controls/Validation";

const extensionContext = VSS.getExtensionContext();
const client = WITClient.getClient();

interface IQuery {
  id: string;
  isPublic: boolean;
  name: string;
  path: string;
  wiql: string;
}

interface IActionContext {
  id?: number;
  workItemId?: number;
  query?: IQuery;
  queryText?: string;
  ids?: number[];
  workItemIds?: number[];
  columns?: string[];
}

const workitemstats = {
  getMenuItems: (context: any) => {
    // Uses the plural of cards if more than one are selected
    let menuItemText = "One Selected";
    if (context.workItemIds && context.workItemIds.length > 1) {
      menuItemText = "Multiple Selected";
    }

    return [
      {
        // action: (actionContext: IActionContext) => {
        //   const wids = actionContext.workItemIds || actionContext.ids || [actionContext.workItemId || actionContext.id];

        //   return getWorkItems(wids)
        //     .then(workItems => getWorkItemStats(workItems))
        // },
        icon: "img/icon.png",
        text: menuItemText,
        title: menuItemText
      } as IContributedMenuItem];
  }
};

// Promises
function getWorkItems(wids: number[]): IPromise<Models.WorkItem[]> {
  return client.getWorkItems(
    wids,
    undefined,
    undefined,
    Models.WorkItemExpand.All
  );
}

function getWorkItemStats(workItems: Models.WorkItem[]): number {
  return 1;
}

VSS.register(
  `${extensionContext.publisherId}.${
    extensionContext.extensionId
  }.workitemstats`,
  workitemstats
);