sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.siemens.datadictionary.controller.BaseController", {

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getServiceUrl:function(){
			return this.getOwnerComponent().getMetadata().getConfig().serviceUrl;
		},

		getServiceXsjsUrl:function(){
			return this.getOwnerComponent().getMetadata().getConfig().serviceUrlXsjs;
		},

		getColumnData:function(){
			return this.getOwnerComponent().getModel("mainView").getProperty("/columnData");
		},

		getSchemaTableName:function(){
			return "\"" + this.getView().byId("idSchema").getValue() + "\".\"" + this.getView().byId("tableName").getValue() + "\"";
		},

		getControl:function(sType,val,mandatory,length){
			   var rType, resourceBundle = this.getResourceBundle();
			   var width = this.getControlWidth(length);
			   switch (sType) {
				case 'DATE':
					rType = new sap.m.DateTimeInput({
						type: "Date",
						width: width,
						dateValue: val ? new Date(val) : new Date(), //{path : val  , formatter : formatter.modifyDate},
						editable: false,
						displayFormat: "yyyy-MM-dd",
						valueFormat : "yyyy-MM-dd"
					});
					break;
				case 'TIME':
					if (val){
					val.replace("-000001","9999");
					}
					rType = new sap.m.DateTimeInput({
						type: "Time",
						width: width,
						dateValue: val ? new Date(val) : new Date(), //{path : val  ,formatter : formatter.modifyTime},
						editable: false,
						displayFormat: "HH:mm:ss",
						valueFormat: "HH:mm:ss"
					});

					break;
				case 'TIMESTAMP':
					rType = new sap.m.DateTimeInput({
						type: "DateTime",
						width: "10rem",
						dateValue: val ? new Date(val) : new Date(), //{path : val  ,formatter : formatter.modifyTime},
						editable: false,
						displayFormat: val ? "yyyy-MM-dd HH:mm:ss.SSS" : "",
						valueFormat: "yyyy-MM-dd HH:mm:ss.SSS"
					});
					break;
				case 'SECONDDATE':
					rType = new sap.m.DateTimeInput({
						type: "DateTime",
						width: width,
						dateValue: val ? new Date(val) : new Date(), //{path : val  ,formatter : formatter.modifyTime},
						editable: false,
						displayFormat: "yyyy-MM-dd HH:mm:ss.SSS",
						valueFormat: "yyyy-MM-dd HH:mm:ss.SSS"
					});
					break;
				case 'BOOLEAN':
					rType = new sap.m.ToggleButton({
						enabled: false,
						width: width,
						press: function(oEvt) {
							if (oEvt.getSource().getPressed()) {
								oEvt.getSource().setType("Accept");
								oEvt.getSource().setText(resourceBundle.getText("True"));
							} else {
								oEvt.getSource().setType("Reject");
								oEvt.getSource().setText(resourceBundle.getText("False"));
							}
						},
						type: val === 0 ? "Reject" : "Accept",
						text: val === 0 ? resourceBundle.getText("False") : resourceBundle.getText("True"),
						pressed: val === 0 ? false : true

					});
					break;
				default:
					rType = new sap.m.Input({
						type: "Text",
						value: val,
						width: width,
						textAlign: "Center",
						editable: false,
						customData: {
							Type:"sap.ui.core.CustomData",
							  key:"mandatory",
							  value:mandatory // bind custom data
							},
						  liveChange: function(oEvent){
							  var newValue = oEvent.getParameter("newValue"),
								  mandatory = oEvent.getSource().data("mandatory");
							  oEvent.getSource().setValueState(sap.ui.core.ValueState.None); //you can also use None, or just remove this line
							  if (newValue === "" && mandatory === "FALSE"){
								  oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
								 this.enableOperation(false);
							  } else {
								  this.enableOperation(true);
							  }
						  }.bind(this)
					});

					break;
				}
					return rType;
				},
				enableOperation: function(enabled) {

						this.getView().byId("update").setEnabled(enabled);

				},
			getControlWidth: function(length) {
				if (length <= 10) {
					return "6rem";
				}
				if (length <= 20) {
					return "10rem";
				}
				if (length <= 30) {
					return "15rem";
				}
				if (length > 30) {
					return "20rem";
				}
			},

		getFormElement:function(type,mandatory){
			var control;
			var placeholder = type;
			switch (type){
			case "DATE" : 	control = new sap.m.DatePicker({
				valueFormat: "yyyy-MM-dd",
				displayFormat: "yyyy-MM-dd"
			});
			break;
			case "TIME" : 	control = new sap.m.DateTimeInput({
				type:sap.m.DateTimeInputType.Time,
				valueFormat: "HH:mm:ss",
				displayFormat: "HH:mm:ss",
				placeholder: placeholder
			});
			break;
			case "TIMESTAMP" : control = new sap.m.DateTimeInput({
				type:sap.m.DateTimeInputType.DateTime,
				valueFormat: "yyyy-MM-dd HH:mm:ss.SSS",
				displayFormat: "yyyy-MM-dd HH:mm:ss.SSS",
				placeholder: placeholder
			});
			break;
			case "SECONDDATE" : control = new sap.m.DateTimeInput({
				type:sap.m.DateTimeInputType.DateTime,
				valueFormat: "yyyy-MM-dd HH:mm:ss.SSS",
				displayFormat: "yyyy-MM-dd HH:mm:ss.SSS",
				placeholder: placeholder
			});
			break;
			case "BOOLEAN" : control = new sap.m.Switch({
				type:sap.m.SwitchType.AcceptReject
			});
			break;
			default: control = new sap.m.Input({
				placeholder: placeholder,
				customData: {
					  Type:"sap.ui.core.CustomData",
						key:"mandatory",
						value:mandatory // bind custom data
					  },
				liveChange: function(oEvent){
					var newValue = oEvent.getParameter("newValue"),
						mandatory = oEvent.getSource().data("mandatory");
					this.setValueState(sap.ui.core.ValueState.None); //you can also use None, or just remove this line
					if (newValue === "" && mandatory === "FALSE"){
						this.setValueState(sap.ui.core.ValueState.Error);
					}

				}
			});
			}

			return control;
		}
	});

}
);