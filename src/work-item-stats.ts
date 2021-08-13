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

    return getWorkItems(wids).then(workItems => {
      try {
        let workItemSum: number = 0;
        workItemSum = workItems.filter(workItem => workItem.fields["Microsoft.VSTS.Scheduling.StoryPoints"] !== undefined).reduce((sum, current) => sum + current.fields["Microsoft.VSTS.Scheduling.StoryPoints"], 0);

        let menuItemText = workItemSum + " story points";
        if (workItemSum === 1) {
          menuItemText = workItemSum + " story point";
        }
        return [
          {
            action: (actionContext: IActionContext) => {
              VSS.getService(VSS.ServiceIds.Dialog).then(function(dialogService: IHostDialogService) {
                // Build absolute contribution ID for dialogContent
                let extensionCtx = VSS.getExtensionContext();
                let contributionId = extensionCtx.publisherId + "." + extensionCtx.extensionId + ".work-item-stats_popup";

                // Show dialog
                let dialogOptions = {
                    title: "Work Item Stats",
                    width: 600,
                    height: 300,
                    buttons: null
                };

                dialogService.openDialog(contributionId, dialogOptions);
              });
            },
            icon: "img/icon.png",
            text: menuItemText,
            disabled: false
          } as IContributedMenuItem];
      }
      catch (e) {
        console.log(e);
        return [] as IContributedMenuItem[];
      }
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