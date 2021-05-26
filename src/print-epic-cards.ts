import WITClient = require("TFS/WorkItemTracking/RestClient");
import Models = require("TFS/WorkItemTracking/Contracts");
import Q = require("q");
import { StatusIndicator } from "VSS/Controls/StatusIndicator";
import { validateGroup } from "VSS/Controls/Validation";
const epicCardTemplate = require("epic-card.handlebars");

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

const printEpicCards = {
  getMenuItems: (context: any) => {
    // Only shows if all selected cards are epics
    const types = getTypesFromContext(context);
    if (types.every((type) => ["Epic"].indexOf(type) >= 0)) {

      // Uses the plural of cards if more than one are selected
      let menuItemText = "Print Epic Card";
      if (context.workItemIds && context.workItemIds.length > 1) {
        menuItemText = "Print Epic Cards";
      }

      return [
        {
          action: (actionContext: IActionContext) => {
            const wids = actionContext.workItemIds || actionContext.ids || [actionContext.workItemId || actionContext.id];

            return getWorkItems(wids)
              .then(workItems => prepare(workItems))
              .then(pages => {
                return Q.all(pages);
              })
              .then((pages: any) => {
                const workItems = document.createElement("div");
                workItems.setAttribute("class", "container border");
                let wiCardCount = 0;
                pages.forEach(page => {
                  let epicCard: any;

                  wiCardCount++;
                  if (page.type !== "processerror") {
                    epicCard = epicCardTemplate({
                      number: page.id,
                      style_wiNumber: page.id,
                      work_item_type: page.type,
                      title: page.title,
                      description: page.description,
                      tags: page.tags,
                      border_color: page.border_color,
                      icon: page.icon,
                      children: page.children
                    });
                    workItems.innerHTML += epicCard;
                  }
                  else {
                    workItems.innerHTML  += "<div> ERROR <br>" + page.message + "</div>";
                  }
                  // adds a page break at the end of each epic
                  workItems.innerHTML += "<p style='page-break-before: always'><br/>&nbsp;<br/>";
                });
                document.body.appendChild(workItems);

                setTimeout(() => {
                  window.focus(); // needed for IE
                  let ieprint = document.execCommand("print", false, null);
                  if (!ieprint) {
                    (window as any).print();
                  }
                  workItems.parentElement.removeChild(workItems);
                }, 1000);
              });
          },
          icon: "img/icon.png",
          text: menuItemText,
          title: menuItemText
        } as IContributedMenuItem];
    }
    return [] as IContributedMenuItem[];
  }
};

function getTypesFromContext(context: any): string[] {
  // Not all areas use the same format for passing work item type names.
  // "workItemTypeName" for Query preview
  // "workItemTypeNames" for backlogs
  // "workItemType" for boards
  let types = context.workItemTypeNames;
  if (!types && context.workItemType) {
      // Boards only support a single work item
      types = [context.workItemType];
  }
  if (!types && context.workItemTypeName) {
      // Query wi preview
      types = [context.workItemTypeName];
  }
  return types;
}

// Promises
function getWorkItems(wids: number[]): IPromise<Models.WorkItem[]> {
  return client.getWorkItems(
    wids,
    undefined,
    undefined,
    Models.WorkItemExpand.All
  );
}

function getWorkItem(wid: number): IPromise<Models.WorkItem> {
  return client.getWorkItem(
    wid,
    undefined,
    undefined,
    Models.WorkItemExpand.Fields
  );
}

function nz(str: string, strReplace: string): string {
  if (str === undefined) {
    return strReplace;
  }
  return str;
}

 async function buildChildTableHTML(wir: Models.WorkItemRelation[]): Promise<string> {
  let htmlrow: string = "<tr><th>Feature</th><th>Assigned To</th><th>State</th></tr>";
  if (wir) {
    let wids: number[] = wir.map(wid => getLastURLValue(wid.url));
    let children = await getWorkItems(wids);
    children.forEach(child => {
      htmlrow += "<tr>";
      htmlrow += "<td>" + child.fields["System.Title"] + "</td>";
      htmlrow += "<td>" + nz(child.fields["System.AssignedTo"], "-") + "</td>";
      htmlrow += "<td>" + child.fields["System.State"] + "</td>";
      htmlrow +=  "</tr>";
    });
  }
  return htmlrow;
}

function getWorkItemDefinition(thisWorkItem: Models.WorkItem): IPromise<Models.WorkItemType> {
  return client.getWorkItemType(thisWorkItem.fields["System.TeamProject"], thisWorkItem.fields["System.WorkItemType"]);
}

function getLastPathValue(pathText: string): string {
  if (pathText.length > 0) {
    let pathArray: string[] = pathText.split("\\");
    return pathArray[pathArray.length - 1];
  }
  else {
    return pathText;
  }
}

function getLastURLValue(urlText: string): number {
  if (urlText.length > 0) {
    let urlArray: string[] = urlText.split("/");
    return parseInt(urlArray[urlArray.length - 1]);
  }
  else {
    return 0;
  }
}

function prepare(workItems: Models.WorkItem[]) {
  return workItems.map(item => {
    let result = {};

    return getWorkItemDefinition(item).then(async thisWIT => {
      try {
        let template_filled: boolean = false;
        let work_item_color = thisWIT["color"];
        let work_item_icon = thisWIT.icon["url"];
        let tag_val = nz(item.fields["System.Tags"], "");
        let area_val = getLastPathValue(item.fields["System.AreaPath"]);
        let iteration_val = getLastPathValue(item.fields["System.IterationPath"]);
        let child_table_html = await buildChildTableHTML(item.relations).then(value => { return value; });

        if (item.fields["System.WorkItemType"] === "Epic") {
          result = {
            "type": item.fields["System.WorkItemType"],
            "title": item.fields["System.Title"],
            "description":  item.fields["System.Description"],
            "id":  item.fields["System.Id"],
            "estimate" : item.fields["Microsoft.VSTS.Common.BusinessValue"],
            "assigned_to": item.fields["System.AssignedTo"],
            "area_path": area_val,
            "iteration_path": iteration_val,
            "tags": tag_val,
            "border_color": work_item_color,
            "icon": work_item_icon,
            "children": "<table>"  + child_table_html + "</table>"
          };
          template_filled = true;
        }
      }
    catch (e) {
      result = {
        "type": "processerror",
        "message": e
      };
    }
    return result;
    });
  });

}

VSS.register(
  `${extensionContext.publisherId}.${
    extensionContext.extensionId
  }.printepiccards`,
  printEpicCards
);