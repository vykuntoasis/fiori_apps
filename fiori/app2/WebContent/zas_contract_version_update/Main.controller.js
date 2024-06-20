sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/NumberFormat",
	"sap/m/MessageToast",
	'sap/m/MessageBox',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',
	'sap/ui/commons/FormattedTextView'
], function(Controller, NumberFormat, MessageToast, MessageBox, Token, Filter, Dialog, MessageToast, Export ,ExportTypeCSV, FormattedTextView) {
	var filterInfo={};
	var oModel;
	var oFilter;
	var oMainView;
	var versionSelectionDialog;
	//var isSearchPending=false;
	"use strict";
	
	var contractVersion = function(id, path) {
		
		var tFilter= new sap.ui.model.Filter("ReleasePkgName",sap.ui.model.FilterOperator.EQ,filterInfo.RelPkgName);
		var versionDropDown=new sap.m.ComboBox(id, {
			selectedKey: '{' + path + '/CurrProdVer}',
			items: {
				path: '/ReleasePkgVernDataSet',
				sorter: new sap.ui.model.Sorter('Version', true),
				templateShareable: true,
				template: new sap.ui.core.Item({
					key: "{Version}",
					text: "{Version}"
				})
			},
		});
		
		versionDropDown.setModel(oModel);// set model your_data_model to Select element
		versionDropDown.getBinding("items").filter([tFilter]);
		//versionDropDown.bindAggregation("items",tFilter,oItemSelectTemplate);
		return versionDropDown;
	};
	
	var confirmAllCustomer = function(){
		
		var dialog = new sap.m.Dialog({
			title: 'Confirm',
			type: 'Message',
			content: new sap.m.Text({ text: 'Update will be applicable to all the customers associated with the selected Release Package. Do you want to proceed?' }),
			beginButton: new sap.m.Button({
				text: 'Okay',
				press: function () {
					versionDialog(true);
					dialog.close();
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					dialog.close();
				}
			}),
			afterClose: function() {
				dialog.destroy();
			}
		});

		dialog.open();
		
	};
	var versionDialog =function (allCustomer){

		var createContext = oModel.createEntry("/ContractVersionDataSet", {
			properties: {
				RelPkgName: filterInfo.RelPkgName
			},
			success: function() {
				sap.m.MessageToast.show("Creation complete");
			},
			error: function(oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error(JSON.parse(oError.responseText).error.innererror);
			}
		});
		var createPath = createContext.getPath();
		
		var selectedVersion;
		versionSelectionDialog = new sap.m.Dialog({
					title: 'Update Customer Version',
					content: new sap.ui.layout.form.SimpleForm('new-entry-form', {
						editable: true,
						layout: "ResponsiveGridLayout",
						title: "Select Contract Version",
						labelSpanXL: 3,
						labelSpanL: 3,
						labelSpanM: 3,
						labelSpanS: 12,
						adjustLabelSpan: false,
						emptySpanXL: 4,
						emptySpanL: 4,
						emptySpanM: 4,
						emptySpanS: 0,
						columnsXL: 1,
						columnsL: 1,
						columnsM: 1,
						singleContainerFullSize: false,
						content: [
//							new sap.m.Text('VERSION_MESSAGE_TEXT',{
//								text: "On click of Save button this Version will be updated as Current Prod Version for all the active contracts available for selected Cutomer(s) and Release Package."
//							}),
							new sap.m.Label('CONTRACT-VERSION-label', {
								text: 'Contract Version',
								required: true
							}),
							contractVersion('CONTRACT-VERSION-input', createPath)
						]
					}),

					beginButton: new sap.m.Button({
						text: 'Save',
						enabled: {
							parts: [						
								createPath + '/CurrProdVer'					

							],
							formatter: function(version) {
								selectedVersion=version;
								return (version ? true : false);
							}
						},
						press: function() {
							sap.ui.core.BusyIndicator.show();
							var shipTo_shipToNameData=[];
							if(allCustomer){
								var relPkgNameFilter = new sap.ui.model.Filter({
				                    path: "RelPkgName",
				                    operator: sap.ui.model.FilterOperator.EQ,
				                    value1: filterInfo.RelPkgName
				             });
								oModel.read("/ContractVersionDataSet", {
								    filters: [relPkgNameFilter],
								    urlParameters:{"$select" : "ShipTo,ShipToCust" },
								    success: function(oData){
								    	var dataMap ={};
								    	oData.results.forEach(function(shipToData){
								    		dataMap[shipToData.ShipTo]=shipToData.ShipToCust;
								    	});
								    	
								    	var keys = Object.keys(dataMap);
				                        var shipTo_shipToNameData = Object.values(dataMap);
				                        //console.log(keys.toString(),filterInfo.RelPkgName,selectedVersion, shipTo_shipToNameData);
				                        sap.ui.core.BusyIndicator.hide();
				                        onConfirmDialog(keys.toString(),filterInfo.RelPkgName,selectedVersion, shipTo_shipToNameData);
								    }
								});
							}
							else{
								var shipToFilter=[];
							filterInfo.customerFilterData.forEach(function (customerNumber){
								var customerNameFilter = new sap.ui.model.Filter({
				                     path: "ShipTo",
				                     operator: sap.ui.model.FilterOperator.EQ,
				                     value1: customerNumber
				              });
								shipToFilter.push(customerNameFilter);
							});
							
							oModel.read("/ShipToCustSet", {
							    filters: shipToFilter,
							    success: function(oData){
							    	oData.results.forEach(function(shipToData){
							    		shipTo_shipToNameData.push(shipToData.ShipToName);
							    	});
							    	//console.log(oData)
							    	sap.ui.core.BusyIndicator.hide();
							    	onConfirmDialog(filterInfo.ShipTo,filterInfo.RelPkgName,selectedVersion, shipTo_shipToNameData);
							    },
							    // ...
							});
							
							}
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function() {
							versionSelectionDialog.close();
						}.bind(this)
					}),
					afterClose: function() {
						if (versionSelectionDialog) {
							versionSelectionDialog.destroy();
						}
					}
				});

				//to get access to the global model
				oMainView.addDependent(versionSelectionDialog);

				versionSelectionDialog.open();
	};
	var onConfirmDialog= function (customer, releasePackage, version, shipTo_shipToNameData) {
		var shipToNameFormattedText= '';
		if(shipTo_shipToNameData.length>1){
			shipTo_shipToNameData.forEach(function(shipToName){
				shipToNameFormattedText=shipToNameFormattedText+'<li>'+shipToName+'</li>';
			});
		}
		else{
			shipToNameFormattedText=shipTo_shipToNameData.toString();
		}
		
		//shipToNameFormattedText=shipToNameFormattedText+'</ul>';
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form', {
				editable: false,
				width: "610px",
				layout: "ResponsiveGridLayout",
				labelSpanXL: 3,
				labelSpanL: 3,
				labelSpanM: 5,
				labelSpanS: 12,
				adjustLabelSpan: false,
				emptySpanXL: 4,
				emptySpanL: 3,
				emptySpanM: 2,
				emptySpanS: 0,
				columnsXL: 1,
				columnsL: 1,
				columnsM: 1,
				singleContainerFullSize: false,
				content: [
				
								new sap.m.Label({ text: 'Update Customer(s)' }),
								new FormattedTextView('customerNameText',{ htmlText: shipToNameFormattedText }),
								new sap.m.Label({ text: 'For this Release Package' }),
								new sap.m.Text({ text: releasePackage }),
								new sap.m.Label({ text: 'to have this Current Prod Version' }),
								new sap.m.Text({ text: version })
								
				]
			
			}),
			new sap.m.Text({
				text: 'This updates Current Prod Version in SAP and SalesForce.'
				//width: '100%'
			})
				],
			beginButton: new sap.m.Button({
				text: 'Submit',
				press: function () {
					submitChanges(customer, releasePackage, version);
					dialog.close();
					if (versionSelectionDialog) {
						versionSelectionDialog.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					dialog.close();
				}
			}),
			afterClose: function() {
				dialog.destroy();
			}
		});

		dialog.open();
	};
	var submitChanges= function(customer, releasePackage, version){
		var aUrlParams = {
		        "RelPkgName": releasePackage,
		        "CurrProdVer": version,
		        "ShipTo": customer
		      };
		console.log(aUrlParams);
		sap.ui.core.BusyIndicator.show();
		oModel.callFunction("/UpdateContractVersion", { // function import name
	        "method": "POST",
	        "urlParameters": aUrlParams, // function import parameters
	        "success": function(oData, response) {
	          //Short circuit evaluation to check if 'Comments' is an attribute:
	         console.log(oData);
	         sap.ui.core.BusyIndicator.hide();
	         if(oData.Identifier && oData.Identifier===2 && !oData.Success){
	        	 MessageBox.error("No authorization to update.");
		        	if (versionSelectionDialog) {
						versionSelectionDialog.close();
					}
		        	return false;
	         }
	         else{
	        	 MessageBox.success("Customer Version updated successfully.");
	         oModel.refresh();
	         if (versionSelectionDialog) {
					versionSelectionDialog.close();
				}
	        }
	        }, // callback function for success
	        "error": function(oError) {
	        	sap.ui.core.BusyIndicator.hide();
	        	MessageBox.error("Error occured during update. Please contact technical support team.");
	        	if (versionSelectionDialog) {
					versionSelectionDialog.close();
				}
	            //that._displayMessage("Failed to update contract long text for this record.", sap.ui.core.MessageType.Error);
	          } // callback function for error
	      });
	};
	
	
	var CController = Controller.extend("ZAS_CONTRACT_VERSION_UPDATE.zas_contract_version_update.Main", {
	onInit: function() {
		
		oMainView = this.getView();  
		var oTable = oMainView.byId("smartTable0");
		
		
		oModel = this.getOwnerComponent().getModel();
		oModel.setSizeLimit(500);
		oFilter = oMainView.byId("filterBar0");
		
		oModel.attachMetadataLoaded(oModel, function() {
			oMainView.setModel(oModel);
		});
//		oFilter.attachFilterChange(function(){
//			var filterData = oFilter.getFilterData();
//			if(filterData.hasOwnProperty("RelPkgName") || filterData.hasOwnProperty("ShipTo")){
//				oFilter.setShowGoOnFB(true);
//				
//			}else{
//				oFilter.setShowGoOnFB(false);
//			}
//		});
		
//		oFilter.attachSearch(function() {
//			var filterData = oFilter.getFilterData();
//			console.log(filterData);
//			if(filterData.hasOwnProperty("RelPkgName") || filterData.hasOwnProperty("ShipTo")){
//			if (filterData.hasOwnProperty("RelPkgName")) {
//				filterInfo.RelPkgName=filterData["RelPkgName"].items[0].key;
//			}
//			if (filterData.hasOwnProperty("ShipTo")) {
//				filterInfo.ShipTo=filterData["ShipTo"].items[0].key;
//			}
//			}
//			else{
//				MessageBox.error("Please select at least one selection criteria to run the search");
//				//oFilter.destroy();
//				
//			}
//		});
		oTable.attachInitialise(function() {
			
			var columns = oTable.getTable().getColumns();
			oTable.getTable().setEnableSelectAll(false);

			columns.forEach(function(c) {
				c.setShowFilterMenuEntry(false);
				c.setWidth("130px");
			});
			
		});
		
oTable.attachAfterVariantApply(function() {
			
			var columns = oTable.getTable().getColumns();

			columns.forEach(function(c) {
				c.setWidth("130px");
			});
			
			
		});

//oFilter.attachPendingChange(function(){
//	isSearchPending=true;
//});
//oFilter.attachAfterVariantLoad(function(){
//	oFilter.search();
//})
//oTable.attachAfterVariantInitialise(function() {
//			
//			var columns = oTable.getTable().getColumns();
//			oTable.getTable().setEnableSelectAll(false);
//
//			columns.forEach(function(c) {
//				c.setShowFilterMenuEntry(false);
//				c.setWidth("130px");
//			});
//			
//		});
	},
updateVersion: function(){
	
	var oTable = oMainView.byId("smartTable0");
	if(!oTable.getTable().getBinding('rows') || !oTable.getTable().getBinding('rows').getLength()){
		MessageBox.error("There is nothing to update as there is no output for this search criteria. Please change the search criteria and apply search.");
		return;
	}
	
	
	var oFilter = oMainView.byId("filterBar0");
	var filterData = oFilter.getFilterData();
	if(filterData.hasOwnProperty("RelPkgName")){
		if(filterData["RelPkgName"].items.length>1){
				MessageBox.error("Please select only one Release package in search criteria to proceed with Customer Version Update.");
				return;
			}else{
				var customerFilterData= [];
				filterInfo.RelPkgName=filterData["RelPkgName"].items[0].key;
				if(filterData["ShipTo"] && filterData["ShipTo"].items.length){
				filterData["ShipTo"].items.forEach(function(item){
					customerFilterData.push(item.key);
				});
				filterInfo.ShipTo= customerFilterData.toString();
				filterInfo.customerFilterData=customerFilterData;
				versionDialog(false);
			   }else if(filterData["ShipTo"] && filterData["ShipTo"].ranges.length){
				filterData["ShipTo"].ranges.forEach(function(item){
					customerFilterData.push(item.value1);
				});
				filterInfo.ShipTo= customerFilterData.toString();
				filterInfo.customerFilterData=customerFilterData;
				versionDialog(false);
			}else{
				confirmAllCustomer();
			}
				
			}
		
	}else{
		MessageBox.error("Please select Release Package in search criteria to proceed with Customer Version Update.");
		return;
	}
	
	
		},
		clearFilter: function(){
			oFilter.clear();
		}

	});
	return CController;
});

