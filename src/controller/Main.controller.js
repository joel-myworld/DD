sap.ui.define([
	"com/siemens/datadictionary/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/siemens/datadictionary/model/models",
	"com/siemens/datadictionary/controller/utilities",
	"sap/m/MessageBox"
], function (BaseController, History, MessageToast, Filter, FilterOperator, models, utilities, MessageBox) {
	"use strict";

	return BaseController.extend("com.siemens.datadictionary.controller.Main", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onBeforeRendering: function () {
			// filter the list of schemas based on values from manifest
			var items = this.getView().byId("idSchema").getBinding("items");
			var schemas = this.getOwnerComponent().getMetadata().getConfig().schemaName;
			var filters = [];
			for (var i in schemas) {
				filters.push(new sap.ui.model.Filter("SCHEMA_NAME", "EQ", schemas[i]));
			}
			items.filter(new sap.ui.model.Filter(filters, false));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onSchemaSelect: function () {
			this.getView().byId("cbxType").setVisible(true);
			this.getView().byId("lblComboType").setVisible(true);

		},

		CbxSelectType: function () {
			if (this.getView().byId("cbxType").getValue() === "Table") {
				this.getView().byId("lblSelect").setText("Table");
				this.getModel("mainView").setProperty("/tableOperation", true);
				this.getView().byId("idInfoProvTable").setMode("SingleSelectLeft");
			} else {
				this.getView().byId("lblSelect").setText("View");
				this.getModel("mainView").setProperty("/tableOperation", false);
				this.getView().byId("idInfoProvTable").setMode("None");
			}

			this.getView().byId("tableName").setValue("");
			this.getView().byId("lblSelect").setVisible(true);
			this.getView().byId("tableName").setVisible(true);
			this.getView().byId("tabBarDetails").setSelectedKey("Fields");

			if (this._oSelectDialog) {
				this._oSelectDialog.destroy();
				this._oSelectDialog = undefined;
			}
		},

		handleConfirm: function (oEvent) {
			if (oEvent.getParameters().filterString) {
				MessageToast.show(oEvent.getParameters().filterString);
			}
		},

		handleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			var selectType = this.getView().byId("cbxType").getValue();
			this.inputId = oEvent.getSource().getId();
			var dialogName;
			sInputValue = sInputValue ? sInputValue.toLowerCase() : sInputValue;

			if (selectType == "Table") {
				dialogName = "com.siemens.datadictionary.view.fragments.SelectDialogTable";
			} else {
				dialogName = "com.siemens.datadictionary.view.fragments.SelectDialogView";
			}
			// create value help dialog
			if (!this._oSelectDialog) {
				this._oSelectDialog = sap.ui.xmlfragment(dialogName, this);
				this.getView().addDependent(this._oSelectDialog);

			}
			var filters = [];

			var source = this.getView().byId("cbxType").getValue() == this.getResourceBundle().getText("Table") ? "TABLE_NAME" : "VIEW_NAME";

			filters.push(new sap.ui.model.Filter("tolower(" + source + ")",
				sap.ui.model.FilterOperator.Contains, "'" + sInputValue + "'"));
			//sap.ui.model.FilterOperator.Contains, "tolower(" + sInputValue + ")" ));
			filters.push(new sap.ui.model.Filter("SCHEMA_NAME", sap.ui.model.FilterOperator.EQ, this.getView().byId("idSchema").getValue()));
			var serviceFilter = new sap.ui.model.Filter(filters, true);			// create a filter for the binding
			this._oSelectDialog.getBinding("items").filter([serviceFilter]);
			// open value help dialog filtered by the input
			// value
			this._oSelectDialog.open(sInputValue);
		},

		handleIconTabBarSelect: function (oEvent) {
			var sKey = oEvent.getParameter("key");
			var tableName = this.getView().byId("tableName").getValue();
			if (tableName && sKey === "Data" && oEvent.getSource().getExpanded() &&
				this.getModel("mainDataXsjs").getProperty("/dataSourcce") !== this.getSchemaTableName()) {
				this.getModel("mainDataXsjs").setProperty("/dataSourcce", this.getSchemaTableName());
				this.getData();
			} else {
// do nothing
			}
		},

		getData: function () {
			this.getView().byId("idInfoProvTable").setBusy(true);
			//var jsonModel = this.getView().byId("idInfoProvTable").getModel();
			//var resultData = this.getView().byId("idInfoProvTable").getModel().getData().bindingData;

			var sServiceUrl = this.getServiceXsjsUrl();
			sServiceUrl = sServiceUrl + "CMD=read";
			var payload = {
				"sTableName": this.getSchemaTableName()
			};
			var oPayload = JSON.stringify(payload);
			models.operationCall(sServiceUrl, oPayload, "", "", jQuery.proxy(this.handleReadSuccess, this), jQuery.proxy(this.handleReadError, this));

		},
		handleReadSuccess: function (data) {
			var dd = data.values; //JSON.parse(data);
			this.getView().byId("idInfoProvTable").setBusy(false);
			this.getModel("mainDataXsjs").setProperty("/rows", dd);


			this.getView().byId("idInfoProvTable").bindAggregation("items", "mainDataXsjs>/rows", function (id, context) {
				var cells = [];
				var obj = context.getObject();
				var columns = this.getModel("mainDataXsjs").getProperty("/bindingData");

				for (var i = 0; i < columns.length; i++) {
					var val = context.getProperty(Object.keys(obj)[i]);
					cells.push(this.getControl(columns[i].DATA_TYPE_NAME, val, columns[i].IS_NULLABLE, columns[i].LENGTH));
				}

				return new sap.m.ColumnListItem({
					cells: cells
				});

			}.bind(this));


		},

		handleCreateSuccess: function () {
			MessageToast.show(this.getResourceBundle().getText("successCreate"));
			this.onRefresh();
		},

		handleUpdateSuccess: function () {
			MessageToast.show(this.getResourceBundle().getText("successUpdate"));
			this.onRefresh();
		},

		handleDeleteSuccess: function () {
			MessageToast.show(this.getResourceBundle().getText("successDelete"));
			this.onRefresh();
		},

		handleReadError: function () {
			MessageToast.show(this.getResourceBundle().getText("Error"));
		},

		handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");

			var filters = [];

			sValue = sValue ? sValue.toLowerCase() : sValue;

			var source = this.getView().byId("cbxType").getValue() == this.getResourceBundle().getText("Table") ? "TABLE_NAME" : "VIEW_NAME";

			filters.push(new sap.ui.model.Filter("tolower(" + source + ")",
				sap.ui.model.FilterOperator.Contains, "'" + sValue + "'"));
			filters.push(new sap.ui.model.Filter("SCHEMA_NAME", sap.ui.model.FilterOperator.EQ, this.getView().byId("idSchema").getValue()));
			var serviceFilter = new sap.ui.model.Filter(filters, true);			// create a filter for the binding
			evt.getSource().getBinding("items").filter([serviceFilter]);
		},

		handleValueHelpClose: function (evt) {
			this.getView().byId("maxRow").setValue('').setVisible(true);
			this.getView().byId("queryString").setValue('').setVisible(true);

			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.getView().byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			//			evt.getSource().getBinding("items").filter([]);

			var selectType = this.getView().byId("cbxType").getValue();
			var filterArray = [];
			filterArray.push(new sap.ui.model.Filter("SCHEMA_NAME", sap.ui.model.FilterOperator.EQ, this.getView().byId("idSchema").getValue()));

			var entityName = "";

			if (selectType == this.getResourceBundle().getText("Table")) {
				filterArray.push(new sap.ui.model.Filter("TABLE_NAME", sap.ui.model.FilterOperator.EQ, oSelectedItem.getTitle()));
				entityName = "/TColumns";
			} else {
				filterArray.push(new sap.ui.model.Filter("VIEW_NAME", sap.ui.model.FilterOperator.EQ, oSelectedItem.getTitle()));
				entityName = "/VColumns";
			}
			var serviceFilter = new sap.ui.model.Filter(filterArray, true);

			this.getView().getModel().read(entityName, {
				filters: [serviceFilter],
				urlParameters: {
					$orderby: "POSITION",
					$select: "COLUMN_NAME,DATA_TYPE_NAME,LENGTH,SCALE,IS_NULLABLE,DEFAULT_VALUE,COMMENTS",
					$format: "json"
				},
				success: jQuery.proxy(this.fnReadSuccess, this),
				error: function errorFn(error) {
					new sap.m.MessageToast(this.getResourceBundle().getText("Error") + error);
				}
			});
		},

		fnReadSuccess: function (oData) {
			var rs = oData.results;
			var jsonModel = this.getModel("mainDataXsjs");
			jsonModel.setProperty("/bindingData", rs);
			jsonModel.setProperty("/count", rs.length);

			var columnData = rs.map(function (a) { return { COLUMN_NAME: a.COLUMN_NAME, DATA_TYPE_NAME: a.DATA_TYPE_NAME }; });
			this.getModel("mainView").setProperty("/columnData", columnData);

			var sKey = this.getView().byId("tabBarDetails").getSelectedKey();
			if (sKey === "Data" && this.getView().byId("tabBarDetails").getExpanded() &&
				this.getModel("mainDataXsjs").getProperty("/dataSourcce") !== this.getSchemaTableName()) {
				this.getModel("mainDataXsjs").setProperty("/dataSourcce", this.getSchemaTableName());
				this.getData();
			}
		},

		onReset: function () {
			this.getView().byId("cbxType").setVisible(false);
			this.getView().byId("lblComboType").setVisible(false);
			this.getView().byId("tableName").setValue("");
			this.getView().byId("idSchema").setSelectedKey(null);
			this.getView().byId("cbxType").setSelectedKey(null);
			this.getView().byId("lblSelect").setVisible(false);
			this.getView().byId("tableName").setVisible(false);
			this.getView().byId("offSet").setVisible(false).setValue('');
			this.getView().byId("maxRow").setVisible(false).setValue('');
			this.getView().byId("queryString").setVisible(false).setValue('');
			this.getModel("mainDataXsjs").setProperty("/bindingData", []);
			this.getModel("mainDataXsjs").setProperty("/rows", []);
			this.getModel("mainView").setProperty("/dataSource", "");
			this.getModel("mainView").setProperty("/columnData", "");
			this.getModel("mainDataXsjs").setProperty("/count", "");
			this.getView().byId("tabBarDetails").setSelectedKey("Fields");
		},

		onFilter: function () {
			/*var oModel = this.getModel("mainDataXsjs");
			oModel.updateBindings(true);
			this.getView().byId("idInfoProvTable").removeSelections(true);*/
			this.onRefresh();
		},

		onRefresh: function () {
			var sServiceUrl = this.getServiceXsjsUrl() + "cmd=read";
			var offset = this.getView().byId("offSet").getValue();
			var limit = this.getView().byId("maxRow").getValue();
			var query = this.getView().byId("queryString").getValue();
			var payload = {
				"sTableName": this.getSchemaTableName(),
				"condition": query || undefined,
				"limit": limit || undefined,
				"offset": offset || undefined
			};
			var oPayload = JSON.stringify(payload);
			models.operationCall(sServiceUrl, oPayload, "", "", jQuery.proxy(this.handleFilterSuccess, this), jQuery.proxy(this.handleReadError, this));
		},

		handleFilterSuccess: function (data) {
			var oModel = this.getModel("mainDataXsjs");
			oModel.setProperty("/rows", data.values);
			oModel.updateBindings(true);
			this.getView().byId("idInfoProvTable").removeSelections(true);
		},

		onExit: function () {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},
		onUpdate: function () {
			var obj = this.getCurrentRecords();
			var sServiceUrl = this.getServiceXsjsUrl();
			sServiceUrl = sServiceUrl + "cmd=update";

			var payload = {
				"originalRecords": JSON.stringify(this.oldrow),
				"currentRecords": JSON.stringify(obj),
				"sTableName": this.getSchemaTableName(),
				"columnsType": JSON.stringify(this.getColumnData())
			};
			var oPayload = JSON.stringify(payload);
			models.operationCall(sServiceUrl, oPayload, "", "", jQuery.proxy(this.handleUpdateSuccess, this), jQuery.proxy(this.handleReadError, this));

		},
		getCurrentRecords: function () {
			var index = this.getView().byId("idInfoProvTable").getSelectedContextPaths()[0].split("/");
			index = index[index.length - 1];
			var items = this.getView().byId("idInfoProvTable").getItems();
			var columns = this.getView().byId("idInfoProvTable").getColumns();
			var types = this.getView().byId("tableFields").getItems();
			var data = {};
			for (var i in columns) {
				if (types[i].getCells()[1].getText() === "DATE") {
					data[columns[i].getHeader().getText()] = items[index].getCells()[i].getValue();
				} else if (types[i].getCells()[1].getText() === "BOOLEAN") {
					data[columns[i].getHeader().getText()] = items[index].getCells()[i].getPressed();
				} else {
					data[columns[i].getHeader().getText()] = items[index].getCells()[i].getValue();
				}
			}
			return data;
		},

		onDelete: function () {
			var obj = this.getCurrentRecords();
			var sServiceUrl = this.getServiceXsjsUrl();
			sServiceUrl = sServiceUrl + "cmd=delete";

			var payload = {
				"originalRecords": obj,
				"sTableName": this.getSchemaTableName(),
				"columnsType": JSON.stringify(this.getColumnData())
			};

			var oPayload = JSON.stringify(payload);
			models.operationCall(sServiceUrl, oPayload, "", "", jQuery.proxy(this.handleDeleteSuccess, this), jQuery.proxy(this.handleReadError, this));
		},

		onAddEntry: function () {
			if (this.oAddDialog) {
				this.oAddDialog.getContent()[0].removeAllContent();
			}
			if (!this.oAddDialog) {
				this.oAddDialog = sap.ui.xmlfragment("com.siemens.datadictionary.view.fragments.CreateDialog", this);
				this.getView().addDependent(this.oAddDialog);
			}
			var addForm = this.oAddDialog.getContent()[0];
			var columns = this.getView().byId("idInfoProvTable").getColumns();
			var type, mandatory;
			for (var i in columns) {
				type = this.getView().byId("tableFields").getItems()[i].getCells()[1].getText();
				mandatory = this.getView().byId("tableFields").getItems()[i].getCells()[4].getText();

				addForm.addContent(new sap.m.Label({
					text: columns[i].getHeader().getText(),
					required: mandatory === "FALSE" ? true : false
				}));
				addForm.addContent(this.getFormElement(type, mandatory));
			}

			this.oAddDialog.open();

		},
		onCreateEntry: function (oEvent) {
			var data;
			if (this.oAddDialog) {
				data = {};
				var cols = this.getView().byId("idInfoProvTable").getColumns();
				var fields = this.oAddDialog.getContent()[0].getContent();
				var passed = this.checkMandatory(fields);
				if (passed) {
					for (var i in cols) {
						if (fields[parseInt(i, 10) * 2 + 1].getMetadata()._mAllProperties.hasOwnProperty("type") && fields[parseInt(i, 10) * 2 + 1].getType() === "AcceptReject") {
							data[cols[i].getHeader().getText()] = fields[parseInt(i, 10) * 2 + 1].getState();
						} else {

							data[cols[i].getHeader().getText()] = fields[parseInt(i, 10) * 2 + 1].getValue();
						}
					}
				} else {
					MessageToast.show(this.getResourceBundle().getText("insufficientInput"));
					return;
				}
			}

			var sServiceUrl = this.getServiceXsjsUrl();

			sServiceUrl = sServiceUrl + "cmd=insert";
			var payload = {
				"currentRecords": data,
				"sTableName": this.getSchemaTableName()
			};
			var oPayload = JSON.stringify(payload);
			models.operationCall(sServiceUrl, oPayload, "", "", jQuery.proxy(this.handleCreateSuccess, this), jQuery.proxy(this.handleReadError, this));
			oEvent.getSource().getParent().getParent().close();

		},

		checkMandatory: function (fields) {
			for (var i = 0; i < fields.length; i = i + 2) {
				if (fields[i].getRequired()) {
					if (!(fields[parseInt(i, 10) * 2 + 1].getType() === "AcceptReject") && fields[parseInt(i, 10) + 1].getValue().trim() === "") {
						fields[i + 1].setValueState(sap.ui.core.ValueState.Error);
						return false;
					}
				}

			}
			return true;
		},

		onSelectionChange: function (oEvent) {
			this.oldrow = jQuery.extend({}, this.getCurrentRecords());

			if (this.oldRowCells) {
				jQuery.each(this.oldRowCells, function (index, value) {
					if (value.getType() === "Accept" || value.getType() === "Reject") {
						value.setEnabled(false);
					} else {

						value.setEditable(false);
					}
				});
			}

			this.oldRowCells = oEvent.getParameter("listItem").getCells();

			if (this.oldRowCells) {
				jQuery.each(this.oldRowCells, function (index, value) {
					if (value.getType() === "Accept" || value.getType() === "Reject") {
						value.setEnabled(true);
					} else {

						value.setEditable(true);
					}
				});
			}



		},
		onclose: function (oEvent) {
			oEvent.getSource().getParent().getParent().close();
		},
		/**
		 * Opens export to excel menu control
		 * @param {sap.ui.base.Event} oEvent - on Click event
		 * @return {void}
		 * @public
		 */
		onDownload: function (oEvent) {
			var iRowCount = this.getView().byId("idInfoProvTable").getItems(),
				sErrMessage,
				oOptions;

			//Check limitations on Export
			if (iRowCount > 1000) {
				oOptions = {
					title: this.getResourceBundle().getText("Error"),
					icon: MessageBox.Icon.ERROR,
					actions: [MessageBox.Action.ABORT],
					initialFocus: MessageBox.Action.ABORT,
					styleClass: this.getOwnerComponent().getContentDensityClass()
				};

				sErrMessage = this.getResourceBundle().getText("exportErorrMsg", [iRowCount, 1000]);

				//Show Error message
				MessageBox.show(sErrMessage, oOptions);
				return;
			}
			utilities.openExportPopover(oEvent, this.getView(), this);
		},
		onExportPressed: function (oEvent) {
			utilities.onExportPressed(oEvent, this);
		},
		/**
		 * Function to open a dialog to edit a node
		 * @param {object} oEvent event object for file type mismatch
		 * @public
		 * @returns {void}
		 */
		handleTypeMissmatch: function (oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function (key, value) {
				aFileTypes[key] = "*." + value;

			});
			var sSupportedFileTypes = aFileTypes.join(", ");
			MessageToast.show(this.getResourceBundle().getText("fileTypeMismatch", [oEvent.getParameter("fileType"), sSupportedFileTypes]));
		},
		/**
		 * Function to upload a csv/xls file
		 *
		 * @public
		 * @returns {void}
		 */
		handleUploadPress: function () {
			var oFileUploader = this._oUploadDialog.getAggregation("content")[0];
			if (!oFileUploader.getValue()) {
				MessageToast.show(this.getResourceBundle().getText("fileSelect"));
				return;
			}

			// Header Slug
			var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				value: oFileUploader.getValue()
			});
			// Header HIERARCHY_ID
			var oCustomerHeaderTableID = new sap.ui.unified.FileUploaderParameter({
				name: "Table_Name",
				value: this.getView().byId("tableName").getValue()
			});

			oFileUploader.addHeaderParameter(oCustomerHeaderSlug);
			oFileUploader.addHeaderParameter(oCustomerHeaderTableID);
			oFileUploader.setSendXHR(true);
			this._oUploadDialog.setBusy(true);
			oFileUploader.upload();
		},
		onUpload: function () {
			if (!this._oUploadDialog) {
				this._oUploadDialog = sap.ui.xmlfragment("com.siemens.datadictionary.view.fragments.Upload", this);
				this.getView().addDependent(this._oUploadDialog);
			}
			this._oUploadDialog.open();
		},
		onCloseUpload: function () {
			if (this._oUploadDialog) {
				this._oUploadDialog.close();
			}
		}
	});

});