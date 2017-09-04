/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/siemens/datadictionary/model/models",
    "sap/ui/model/odata/v2/ODataModel",
    "com/siemens/datadictionary/controller/ErrorHandler"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("com.siemens.datadictionary.Component", {
        metadata: { manifest: "json" },
        _oErrorHandler: null,
        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * In this function, the FLP and device models are set and the router is initialized.
         * @public
         * @override
         */
        init: function () {
            // reads Component's metadata configuration
            var mConfig = this.getMetadata().getConfig();

            // initialize the resource bundle with the component
            this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");

            // initialize the device model with the omponent
            this.setModel(models.createDeviceModel(), "device");

            // initialize main XSOData service for column and Hierarchy Maintenance configuration data

            var oMainModel = models.createODataModelWithParameters(mConfig.serviceUrl);
            this.setModel(oMainModel);


            // create promise which is resolved when metadata is loaded
            this._createMetadataPromise(oMainModel);

            // error when metadata has been not loaded
            oMainModel.attachMetadataFailed(function () {
                jQuery.sap.log.error("Failed to load metadata", "com.siemens.datadictionary.Component");
            });


            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(models.createXsjsDataModel(), "mainDataXsjs");

            this.setModel(models.createViewModel(), "mainView");

            // create the views based on the url/hash
            this.getRouter().initialize();

            //initialize error Handling
            //this._oErrorHandler  = new ErrorHandler(this);
        },

        /**
         * In this function, the rootView is initialized and stored.
         * @returns {sap.ui.core.mvc.XMLView} - the root view of the component
         * @public
         * @override
         */
        createContent: function () {
            // call the base component's createContent function
            var oRootView = UIComponent.prototype.createContent.apply(this, arguments);
            oRootView.addStyleClass(this.getContentDensityClass());
            return oRootView;
        },

        /**
         * The component is destroyed by UI5 automatically.
         * In this method, the ErrorHandler is destroyed.
         * @public
         * @override
         */
        destroy: function () {
            if (this._oErrorHandler) {
                this._oErrorHandler.destroy();
            }
            try {
                this.getModel().destroy();
            } catch (e) {
                jQuery.sap.log.info("failed to destroy model");
            }
            this.getModel("i18n").destroy();
            this.getModel("device").destroy();
            this.getModel("FLP").destroy();
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        /**
         * Creates a promise which is resolved when the metadata is loaded.
         * @param {sap.ui.model.odata.v2.ODataModel} oModel - the app model
         * @private
         */
        _createMetadataPromise: function (oModel) {
            this.oWhenMetadataIsLoaded = new Promise(function (fnResolve, fnReject) {
                oModel.attachEventOnce("metadataLoaded", fnResolve);
                oModel.attachEventOnce("metadataFailed", fnReject);
            });
        },
        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                // check whether FLP has already set the content density class; do nothing in this case
                if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                    this._sContentDensityClass = "";
                } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});