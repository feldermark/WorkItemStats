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
    const wids = context.workItemIds;

    // Uses the plural of cards if more than one are selected
    // let menuItemText = "One Selected";
    // if (wids && wids.length > 1) {
    //   menuItemText = "Multiple Selected";
    // }

    // console.log(wids.length + "selected");
    // console.log(context);
    // console.log(wids);

    // getWorkItems(wids).then(workItems => workItems.reduce((sum, current) => sum + current.fields["System.StoryPoints"], 0));
    // menuItemText = sum;

    return getWorkItems(wids).then(workItems => {
      let workItemSum: number = 0;
      workItemSum = workItems.reduce((sum, current) => sum + current.fields["Microsoft.VSTS.Scheduling.StoryPoints"], 0);

      let menuItemText = workItemSum + " story points";
      if (workItemSum === 1) {
        menuItemText = workItemSum + " story point";
      }

      // Add if here to not return a menu item if we have no points?

      return [
        {
          // action: // This has no action right now
          icon: "img/icon.png",
          text: menuItemText,
          // title: menuItemText,
          disabled: true // Disabling this button until I decide to make it do something. It could show an popup with additional stats
        } as IContributedMenuItem];
    });
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

VSS.register(
  `${extensionContext.publisherId}.${
    extensionContext.extensionId
  }.workitemstats`,
  workitemstats
);