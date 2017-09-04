sap.ui.define([ "sap/ui/model/json/JSONModel",
			"sap/ui/model/odata/v2/ODataModel", "sap/ui/Device",
			"sap/ui/model/resource/ResourceModel" ],
			function(JSONModel, ODataModel, Device, ResourceModel) {
			"use strict";

			function extendMetadataUrlParameters(aUrlParametersToAdd,
					oMetadataUrlParams, sServiceUrl) {
				var oExtensionObject = {}, oServiceUri = new URI(
						sServiceUrl);

				aUrlParametersToAdd
				.forEach(function(sUrlParam) {
					var oUrlParameters, sParameterValue;

					if (sUrlParam === "sap-language") {
						var fnGetuser = jQuery.sap
						.getObject("sap.ushell.Container.getUser");

						if (fnGetuser) {
							// for sap-language we check if the
							// launchpad can provide it.
							oMetadataUrlParams["sap-language"] = fnGetuser()
							.getLanguage();
						}
					} else {
						oUrlParameters = jQuery.sap
						.getUriParameters();
						sParameterValue = oUrlParameters
						.get(sUrlParam);
						if (sParameterValue) {
							oMetadataUrlParams[sUrlParam] = sParameterValue;
							oServiceUri.addSearch(sUrlParam,
									sParameterValue);
						}
					}
				});

				jQuery.extend(oMetadataUrlParams, oExtensionObject);
				return oServiceUri.toString();
			}

			return {

				createDeviceModel : function() {
					var oModel = new JSONModel(Device);
					oModel.setDefaultBindingMode("OneWay");
					return oModel;
				},

				createFLPModel : function() {
					var fnGetUser = jQuery.sap
					.getObject("sap.ushell.Container.getUser"), bIsShareInJamActive = fnGetUser ? fnGetUser()
							.isJamActive()
							: false, oModel = new JSONModel({
								isShareInJamActive : bIsShareInJamActive
							});
							oModel.setDefaultBindingMode("OneWay");
							return oModel;
				},

				/**
				 * Create resource model using name of Resource
				 * specified in Component's metadata
				 *
				 * @param {string}
				 *            sBundleName - name of Resource Bundle
				 * @returns {sap.ui.model.resource.ResourceModel}
				 *          Resource Bundle
				 * @public
				 */
				createResourceModel : function(sBundleName) {
					return new ResourceModel({
						"bundleName" : sBundleName
					});
				},

				/**
				 * Create OData Model with parameters
				 *
				 * @param {string}
				 *            sServiceUrl - Service Url
				 * @returns {*|sap.ui.model.odata.v2.ODataModel} New
				 *          OData model
				 * @public
				 */
				createODataModelWithParameters : function(sServiceUrl) {
					var oModel = this.createODataModel({
						urlParametersForEveryRequest : [ "sap-server",
							"sap-client", "sap-language" ],
							url : sServiceUrl,
							config : {
								metadataUrlParams : {
									"sap-documentation" : "heading"
								},
								json : true,
								defaultBindingMode : "TwoWay",
								defaultCountMode : "Inline",
								useBatch : false
							}
					});

					return oModel;
				},

				/*
				 * @param [oOptions.config] {object} see
				 * {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters}
				 * it is the exact same object, the metadataUrlParams
				 * are enrichted by the oOptions.urlParametersToPassOn
				 * @returns {sap.ui.model.odata.v2.ODataModel} @public
				 */
				createODataModel : function(oOptions) {
					var aUrlParametersForEveryRequest, sUrl, oConfig = {};

					oOptions = oOptions || {};

					if (!oOptions.url) {
						jQuery.sap.log
						.error(
								"Please provide a url when you want to create an ODataModel",
						"com.siemens.tableViewer.models.createODataModel");
						return null;
					}

					// create a copied instance since we modify the
					// config
					oConfig = jQuery.extend(true, {}, oOptions.config);

					aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest
					|| [];
					oConfig.metadataUrlParams = oConfig.metadataUrlParams
					|| {};

					sUrl = extendMetadataUrlParameters(
							aUrlParametersForEveryRequest,
							oConfig.metadataUrlParams, oOptions.url);

					return this._createODataModel(sUrl, oConfig);

				},

				createViewModel : function() {
					// view model
					return new JSONModel({
						tableOperation : true,
						dataSource : "",
						columnData : ""
					});

				},

				createXsjsDataModel : function() {
					// view model
					return new JSONModel({
						bindingData : [],
						rows : [],
						count	:""
					});

				},

				operationCall : function(sServiceUrl, oPayload, oType,
						rType, successHandler, errorHandler) {

					jQuery.ajax({
						url : sServiceUrl,
						data : oPayload,
						type : oType || "POST",
						async : rType || false,
						dataType : "json",
						contentType : "application/json",
						success : successHandler,
						error : errorHandler
					});

				},
				/**
				 * Create OData Model
				 *
				 * @param {string}
				 *            sUrl - Service URL
				 * @param {object}
				 *            oConfig - OData Configuration
				 * @returns {sap.ui.model.odata.v2.ODataModel} OData v2
				 *          model
				 * @private
				 */
				_createODataModel : function(sUrl, oConfig) {
					var oModel = new ODataModel(sUrl, oConfig);
					return oModel;
				}

			};

		});