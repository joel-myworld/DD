sap.ui.define([
], function () {
    "use strict";
    return {

        onExportPressed: function (oEvent, oController) {


            var sFormat = oEvent.getSource().data("id"),
                sFileName = "export." + sFormat,
                sSheetName = "data",
                sServicePath = oController.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("datadictionary.xsodata", "") + "odxl/odxl.xsjs",
                sURL = "",
                sVisibleColumns = this._getVisibleColumns(oController.getView().byId("idInfoProvTable")).toString(),
                sDataSource = oController.getView().byId("tableName").getValue(), // table/CV name
                sFilterParams = oController.getView().byId("queryString").getValue();
            oController.getView().byId("exportMenu").close();
            if (sFilterParams) {
                sFilterParams = "&$filter=" + sFilterParams; // add $filter to the filter params
            }

            //sURL = sServicePath + sDataSource;
            sURL = sServicePath + "/%22" + oController.getView().byId("idSchema").getValue() + "%22/%22" + sDataSource + "%22"; // replace SYS_BIC with selected schema name
            sURL = sURL + "?" +
                "$select=" + sVisibleColumns +
                sFilterParams +
                "&" + "$format=" + sFormat +
                "&" + "fieldsep=;" +
                "&" + "sheetname=" + sSheetName +
                "&" + "download=" + sFileName +
                "&" + "langu=" + this.getAppLanguage()
                ;
            window.open(sURL);

        },

		/**
		 * Helper method to open export popover fragment on export button event
		 * @param {sap.ui.base.Event} oEvent - export button event
		 * @param {Object} oView - current view from where the export is pressed
		 * @param {Object} oParent - reference to controller
		 * @returns {void}
		 * @public
		 */
        openExportPopover: function (oEvent, oView, oParent) {
            var oExportMenu = oView.byId("exportMenu");

            if (!oExportMenu) {
                oExportMenu = sap.ui.xmlfragment(oView.getId(), "com.siemens.datadictionary.view.fragments.Export", oParent);
                oView.addDependent(oExportMenu);
            }

            oExportMenu.openBy(oEvent.getSource());
        },

		/**
         * Method to return the column arrays that are visible in table
         * @param {Object} oTable - table
         * @returns {Array} aColumns - Array of columns which are visible
         * @private
         */
        _getVisibleColumns: function (oTable) {
            var aColumns = [];
            oTable.getColumns().map(function (oColumn) {
                aColumns.push(oColumn.getHeader().getText());
            });
            return aColumns;
        },
		/**
		 * Getter for app language
		 * @public
		 * @return {String}  sLanguage - App language
		 */
        getAppLanguage: function () {
            var sLanguage;
            if (sap.ushell) {
                sLanguage = sap.ushell.Container.getUser().getLanguage();
            } else {
                sLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            }
            return sLanguage.split("-")[0].toUpperCase();
        }
    };
});