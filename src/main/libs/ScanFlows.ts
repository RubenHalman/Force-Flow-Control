import {Flow} from "../models/Flow";
import {UnconnectedElements} from "../rules/UnconnectedElements";
import {UnusedVariables} from "../rules/UnusedVariables";
import {HardcodedIds} from "../rules/HardcodedIds";
import {DMLStatementInLoop} from "../rules/DMLStatementInLoop";
import {MissingFaultPath} from "../rules/MissingFaultPath";
import {DuplicateDMLOperationsByNavigation} from "../rules/DuplicateDMLOperationsByNavigation";
import RuleOptions = require("../models/RuleOptions");
import {MissingFlowDescription} from "../rules/MissingFlowDescription";
import {MissingNullHandler} from "../rules/MissingNullHandler";

export class ScanFlows{

    public execute(flows : Flow[], options : RuleOptions) {

        for (const flow of flows){
            if(options.dmlStatementInLoop){
                flow.dmlStatementInLoop = new DMLStatementInLoop().execute(flow);
            }
            if(options.duplicateDMLOperations){
                flow.duplicateDMLOperationsByNavigation = new DuplicateDMLOperationsByNavigation().execute(flow);
            }
            if(options.hardcodedIds){
                flow.nodesWithHardcodedIds = new HardcodedIds().execute(flow);
            }
            if(options.missingDescription){
                flow.missingDescription = new MissingFlowDescription().execute(flow);
            }
            if(options.missingFaultPaths){
                flow.missingFaultPaths = new MissingFaultPath().execute(flow);
            }
            if(options.missingNullHandlers){
                flow.missingNullHandlers = new MissingNullHandler().execute(flow);
            }
            if(options.unconnectedElements){
                flow.unconnectedElements = new UnconnectedElements().execute(flow);
            }
            if(options.unusedVariables){
                flow.unusedVariables = new UnusedVariables().execute(flow);
            }
        }
    }
}
