import "mocha";
import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "mz/fs";
import {MergeFlows} from "../../main/libs/MergeFlows";
import {ImportMock} from "ts-mock-imports";
import sinon = require("sinon");
import main = require("./testfiles/main-example.json");
import secondary = require("./testfiles/secondary-example.json");
import Flow = require("../../main/models/Flow");
import {RemoveUnusedElements} from "../../main/libs/RemoveUnusedElements";

describe("When merging two pre-defined flows that have a common node with a different connector, it should return a new flow based on User selection",async function () {
    let mergeFlowsInstance: MergeFlows;
    let mainFlow;
    let secondaryFlow;
    this.timeout(0);

    before("Assume User selection is the count connector in order to link the selected flows",  async function () {
        // ARRANGE
        mainFlow = new RemoveUnusedElements().execute(new Flow({
            label: 'main',
            path: 'anypath',
            xmldata : main,
            detail: 'anypath'
        }));
        mainFlow.flownumber = 1;
        secondaryFlow = new RemoveUnusedElements().execute(new Flow({
            label: 'sec',
            path: 'anyotherpath',
            detail: 'anyotherpath',
            xmldata: secondary
        }));
        secondaryFlow.flownumber = 2;

        const showQuickPick = sinon.stub();
        showQuickPick.onCall(0).returns(
            {'label': 'count', 'description': 'from mail', 'flownumber': 1});
        showQuickPick.onCall(1).returns({'label': 'a', 'description': 'a', 'flownumber': '-1'});
        const mockManager = ImportMock.mockOther(vscode, "window", {showQuickPick});
        mergeFlowsInstance = new MergeFlows();
    });
    it("A new flow is returned after resolving a conflict with a split merge according to User selection", async function () {

        // ACT
        let mergedFlow = await mergeFlowsInstance.execute(
            [
                mainFlow, secondaryFlow
            ],
            1
        );

        // ASSERT
        const resultingFlow = mergedFlow.processedData.Flow;
        assert.strictEqual(resultingFlow.decisions[0].defaultConnector[0].targetReference[0],'count');
        assert.strictEqual(resultingFlow.decisions[0].rules.length, 2);
        const notZeroRule = resultingFlow.decisions[0].rules.find(rule => rule.name[0] === "notzero");
        assert.strictEqual(notZeroRule.connector,undefined);
        assert.strictEqual(resultingFlow.status[0],'Draft');

    });
    after("restore dependencies", function () {
        ImportMock.restore();
    });
});