sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/NumberFormat",
	"sap/m/MessageToast",
	'sap/m/MessageBox',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/m/Dialog',
	'sap/ui/core/util/Export',
	'sap/ui/core/util/ExportTypeCSV',
	'sap/ui/commons/FormattedTextView'
], function (Controller, NumberFormat, MessageToast, MessageBox, Token, Filter, Dialog, Export, ExportTypeCSV,
	FormattedTextView) {
	var filterInfo = {};
	var oModel;
	var oMainView;
	// var versionSelectionDialog;
	var addExistingBox;
	var createNewBox;
	var createBetweenBox;
	var reassignProductBox;
	var insertProductBox;
	var createReleasePkgBox;
	"use strict";

	//**Service Flag Dropdown**//
	var serviceableFlag = function (id, path) {

		var serviceFlagDropDown = new sap.m.Select(id, {
			selectedKey: path ? '{' + path + '/ServFlag}' : "{ServFlag}",
			forceSelection: false,
			items: [new sap.ui.core.Item({
					key: "Y",
					text: "Yes"
				}),
				new sap.ui.core.Item({
					key: "N",
					text: "No"
				})
			]
		});

		return serviceFlagDropDown;
	};

	//**Release Package Dropdown**//
	var relPackDropDown = function (id, path) {

		var versionDropDown = new sap.m.Select(id, {
			selectedKey: '{' + path + '/RPDesc}',
			forceSelection: false,
			items: {
				path: '/RPNameSet',
				templateShareable: true,
				template: new sap.ui.core.Item({
					key: "{RPDesc}",
					text: "{RPDesc}"
				}),
				sorter: new sap.ui.model.Sorter('RPDesc', false)
			}
		});

		versionDropDown.setModel(oModel); // set model your_data_model to Select element
		return versionDropDown;
	};

	//**Release Package To Drop Down - For Reassign**//
	var relPackDropDownTo = function (id, path) {
		var tFilter = new sap.ui.model.Filter("RPDesc", sap.ui.model.FilterOperator.NE, filterInfo.RPDesc);
		var versionDropDownTo = new sap.m.Select(id, {
			selectedKey: '{' + path + '/RPDescTo}',
			forceSelection: false,
			items: {
				path: '/RPNameSet',
				templateShareable: true,
				template: new sap.ui.core.Item({
					key: "{RPDesc}",
					text: "{RPDesc}"
				}),
				sorter: new sap.ui.model.Sorter('RPDesc', false)
			}
		});
		versionDropDownTo.setModel(oModel); // set model your_data_model to Select element
		versionDropDownTo.getBinding("items").filter([tFilter]);
		return versionDropDownTo;
	};

	// **Fn for Suggestion items - Our current version not supporting multi search**//
	// var handleSuggest = function (idProp, otherProp, surroundingFilter, oEvent) {
	// 	var sTerm = oEvent.getParameter("suggestValue");
	// 	var aFilters = [];
	// 	if (sTerm && idProp && typeof (sTerm) === 'string') {
	// 		aFilters.push(new sap.ui.model.Filter(idProp, sap.ui.model.FilterOperator.Contains, sTerm.toUpperCase()));
	// 	} else if (sTerm && idProp && !isNaN(+sTerm)) {
	// 		aFilters.push(new sap.ui.model.Filter(idProp, sap.ui.model.FilterOperator.EQ, sTerm));
	// 	}
	// 	if (sTerm && otherProp) {
	// 		aFilters.push(new sap.ui.model.Filter(otherProp, sap.ui.model.FilterOperator.Contains, sTerm.toUpperCase()));
	// 	}
	// 	// Allow either search to succeed.
	// 	var innerFilter = new sap.ui.model.Filter({
	// 		filters: aFilters,
	// 		and: false
	// 	});
	// 	var outerFilters = surroundingFilter ? [surroundingFilter, innerFilter] : [innerFilter];

	// 	// Add other filters
	// 	var outerFilter = new sap.ui.model.Filter({
	// 		filters: outerFilters,
	// 		and: true
	// 	});
	// 	oEvent.getSource().getBinding("suggestionItems").filter(outerFilter);
	// };

	//**Unassigned Product List**//
	var productList = function (id, path) {
		var productListDropDown = new sap.m.Input(id, {
			value: '{' + path + '/Product}',
			showSuggestion: true,
			//forceSuggestionSelection: true,
			//forceSelection: true,
			// suggest: handleSuggest.bind(this, 'Product', 'Desc', null),
			suggestionItems: {
				path: '/UnAssignedProductSHSet',
				templateShareable: true,
				template: new sap.ui.core.ListItem({
					key: "{Product}",
					text: "{Product}",
					additionalText: "{Desc}"
				}),
				sorter: new sap.ui.model.Sorter('Product', false)
			}
		});

		productListDropDown.setModel(oModel); // set model your_data_model to Select element
		return productListDropDown;
	};

	//**NRank Drop Down List**//
	var nRank = function (id, path) {
		var nRankDropDown = new sap.m.Select(id, {
			selectedKey: path ? '{' + path + '/NRank}' : "{NRank}",
			forceSelection: false,
			items: [new sap.ui.core.Item({
					key: "N-1",
					text: "N-1"
				}),
				new sap.ui.core.Item({
					key: "N-2",
					text: "N-2"
				}),
				new sap.ui.core.Item({
					key: ">N-2",
					text: ">N-2"
				})
			]
		});
		return nRankDropDown;
	};

	//**Business Segment Drop Down List**//
	var businessSegment = function (id, path) {
		var businessSegmentDropDown = new sap.m.Select(id, {
			// selectedKey: 'AS-Default',
			selectedKey: '{' + path + '/BSegment}',
			forceSelection: false,
			items: [new sap.ui.core.Item({
					key: "AS-Default",
					text: "AS-Default(1001)"
				}),
				new sap.ui.core.Item({
					key: "Airpas",
					text: "Airpas(3005)"
				}),
//**Added this for Radixx on 09/24/2021**//				
				new sap.ui.core.Item({
					key: "Radixx",
					text: "Radixx(1024)"
				})
			]
		});
		return businessSegmentDropDown;
	};

	//**Once The Remove Product is Complete - Status **//
	var onremoveProductComplete = function (removeData) {
		var removeProductText = '';
		if (removeData.length >= 1) {
			removeData.forEach(function (aData) {
				removeProductText = removeProductText + "<li><strong>Release Package Name: </strong>" + aData.RPDesc +
					", <strong>Product: </strong>" + aData.Product + ", <strong>Update Status: </strong>" + aData.resp + "</li>";
			});
		}
		var dialog = new sap.m.Dialog({
			title: 'Remove Product Status',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-comp', {
					editable: false,
					width: "900px",
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

						new FormattedTextView('RemoveProductTextComp', {
							htmlText: removeProductText

						})
					]

				})
			],
			endButton: new sap.m.Button({
				text: 'OK',
				press: function () {
					dialog.close();
				}
			}),
			afterClose: function () {
				dialog.destroy();
			}
		});

		dialog.open();

	};

	//** On click Create Release Package Confirmation Box**//
	var submitChangescreateReleasePkg = function (createContext, createPath) {

		var aUrlParams = {
			"RPDesc": createContext.getProperty(createPath + '/RPDesc'),
			"BSegment": createContext.getProperty(createPath + '/BSegment')
		};

		console.log(aUrlParams);
		oModel.callFunction("/CreateReleasePkg", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oModel.refresh();
					if (createReleasePkgBox) {
						createReleasePkgBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (createReleasePkgBox) {
						createReleasePkgBox.close();
					}
					return false;
				}
			}, // callback function for success
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while creating the release package. Please contact technical support team.");
				if (createReleasePkgBox) {
					createReleasePkgBox.close();
				}

			}
		});
	};

	//** On click Reassign Product Confirmation Box**//
	var submitChangesreassignProduct = function (createContext, createPath) {

		var oTableMatMas = oMainView.byId("smartTable0");
		var oTable = oTableMatMas.getTable();

		var aUrlParams = {
			"RPDescFrom": createContext.getProperty(createPath + '/RPDesc'),
			"Product": createContext.getProperty(createPath + '/Product'),
			"RPDescTo": createContext.getProperty(createPath + '/RPDescTo')

		};

		console.log(aUrlParams);
		oModel.callFunction("/ReassignProduct", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oTable.clearSelection();
					oModel.refresh();
					if (reassignProductBox) {
						reassignProductBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (reassignProductBox) {
						reassignProductBox.close();
					}
					return false;
				}
			}, // callback function for success
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while reassigning the product. Please contact technical support team.");
				if (reassignProductBox) {
					reassignProductBox.close();
				}

			}
		});
	};

	//** On click Insert Product Confirmation Box**//
	var submitChangesinsertProduct = function (createContext, createPath) {

		var aUrlParams = {
			"RPDesc": createContext.getProperty(createPath + '/RPDesc'),
			"Product": createContext.getProperty(createPath + '/Product')
		};

		console.log(aUrlParams);
		oModel.callFunction("/InsertProduct", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oModel.refresh();
					if (insertProductBox) {
						insertProductBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (insertProductBox) {
						insertProductBox.close();
					}
					return false;
				}
			}, // callback function for success
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while assigning the product to release package. Please contact technical support team.");
				if (insertProductBox) {
					insertProductBox.close();
				}

			}
		});
	};

	//** On click Remove Product Confirmation Box**//
	var submitChangesremoveProduct = function (removeData) {
		var oTableMatMas = oMainView.byId("smartTable0");
		var oTable = oTableMatMas.getTable();

		var changeLength = removeData.length;
		try {

			removeData.forEach(function (deleteEntity) {
				sap.ui.core.BusyIndicator.show();

				var aUrlParams = {

					"RPDesc": deleteEntity.RPDesc,
					"Product": deleteEntity.Product
				};
				console.log(aUrlParams);
				oModel.callFunction("/RemoveProduct", { // function import name
					"method": "POST",
					changeSetId: deleteEntity.changeId,
					"urlParameters": aUrlParams, // function import parameters
					"success": function (oData, response) {
						changeLength--;
						//Short circuit evaluation to check if 'Comments' is an attribute:
						console.log(oData);
						if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
							deleteEntity.resp = oData.Message;
							if (changeLength === 0) {
								sap.ui.core.BusyIndicator.hide();
								oTable.clearSelection();
								oModel.refresh();

								onremoveProductComplete(removeData);
							}
						} else if (oData.Identifier && !oData.Success) {
							deleteEntity.resp = oData.Message;
							if (changeLength === 0) {
								sap.ui.core.BusyIndicator.hide();
								oTable.clearSelection();
								oModel.refresh();

								onremoveProductComplete(removeData);
							}
						}
					}, // callback function for success
					"error": function (oError) {
						changeLength--;
						deleteEntity.resp = "Error";
						if (changeLength === 0) {
							sap.ui.core.BusyIndicator.hide();
							oTable.clearSelection();
							oModel.refresh();

							onremoveProductComplete(removeData);
						}

					}
				});

			});

		} catch (e) {
			sap.ui.core.BusyIndicator.hide();
			MessageBox.error(e);
			removeData = [];
			return false;
		}

	};

	//** On click Add Existing N Rank Confirmation Box**//	
	var submitChanges = function (createContext, createPath) {

		var GADate = createContext.getProperty(createPath + '/GADate');
		if (GADate === '') {
			GADate = new Date('1900-01-01');
		}
		var aUrlParams = {
			"ServFlag": createContext.getProperty(createPath + '/ServFlag'),
			"RPVersion": createContext.getProperty(createPath + '/RPVersion'),
			"RPDesc": createContext.getProperty(createPath + '/RPDesc'),
			'GADate': GADate
		};

		console.log(aUrlParams);
		oModel.callFunction("/AddVersionsExisting", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oModel.refresh();
					if (addExistingBox) {
						addExistingBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (addExistingBox) {
						addExistingBox.close();
					}
					return false;
				}
			},
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while adding version. Please contact technical support team.");
				if (addExistingBox) {
					addExistingBox.close();
				}

			}
		});
	};

	//** On click Add New N Rank Confirmation Box**//	

	var submitChangesNew = function (createContext, createPath) {

		var GADate = createContext.getProperty(createPath + '/GADate');
		if (GADate === '') {
			GADate = new Date('1900-01-01');
		}
		var aUrlParams = {
			"ServFlag": createContext.getProperty(createPath + '/ServFlag'),
			"RPVersion": createContext.getProperty(createPath + '/RPVersion'),
			"RPDesc": createContext.getProperty(createPath + '/RPDesc'),
			'GADate': GADate
		};

		console.log(aUrlParams);
		oModel.callFunction("/AddVersionsNew", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oModel.refresh();
					if (createNewBox) {
						createNewBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (createNewBox) {
						createNewBox.close();
					}
					return false;
				}
			}, // callback function for success
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while adding version. Please contact technical support team.");
				if (createNewBox) {
					createNewBox.close();
				}

			}
		});
	};

	//** On click Add Between N Rank Confirmation Box**//
	var submitChangesBetween = function (createContext, createPath) {

		var GADate = createContext.getProperty(createPath + '/GADate');
		if (GADate === '') {
			GADate = new Date('1900-01-01');
		}
		var aUrlParams = {
			"ServFlag": createContext.getProperty(createPath + '/ServFlag'),
			"RPVersion": createContext.getProperty(createPath + '/RPVersion'),
			"RPDesc": createContext.getProperty(createPath + '/RPDesc'),
			"NRank": createContext.getProperty(createPath + '/NRank'),
			'GADate': GADate
		};

		console.log(aUrlParams);
		oModel.callFunction("/AddVersionsBetween", { // function import name
			"method": "POST",
			"urlParameters": aUrlParams, // function import parameters
			"success": function (oData, response) {
				//Short circuit evaluation to check if 'Comments' is an attribute:
				console.log(oData);
				if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.success(oData.Message);
					oModel.refresh();
					if (createBetweenBox) {
						createBetweenBox.close();
					}
				} else if (oData.Identifier && !oData.Success) {
					oModel.deleteCreatedEntry(createContext);
					MessageBox.error(oData.Message);
					if (createBetweenBox) {
						createBetweenBox.close();
					}
					return false;
				}
			}, // callback function for success
			"error": function (oError) {
				oModel.deleteCreatedEntry(createContext);
				MessageBox.error("Error occured while adding version. Please contact technical support team.");
				if (createBetweenBox) {
					createBetweenBox.close();
				}

			}
		});
	};

	//** Create New Release Package Confirmation Box**//
	var onConfirmDialogcreateReleasePkg = function (createContext, createPath) {
		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var BSegment = createContext.getProperty(createPath + '/BSegment');
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-reassign', {
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

						new sap.m.Label({
							text: 'Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						}),
						new sap.m.Label({
							text: 'Business Segment'
						}),
						new sap.m.Text({
							text: BSegment
						})
					]

				}),
				new sap.m.Text({
					text: 'This action creates a new release package , please confirm'

				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangescreateReleasePkg(createContext, createPath);
					dialog.close();
					if (createReleasePkgBox) {
						createReleasePkgBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Reassign Product Confirmation Box**//
	var onConfirmDialogreassignProduct = function (createContext, createPath) {
		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var Product = createContext.getProperty(createPath + '/Product');
		var RPDescTo = createContext.getProperty(createPath + '/RPDescTo');

		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-reassign', {
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

						new sap.m.Label({
							text: 'Reassign Product'
						}),
						new sap.m.Text({
							text: Product
						}),
						new sap.m.Label({
							text: 'From Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						}),
						new sap.m.Label({
							text: 'To Release Package'
						}),
						new sap.m.Text({
							text: RPDescTo
						})
					]

				}),
				new sap.m.Text({
					text: 'This action reassigns the selected product from one release package to the release package selected, please confirm'

				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangesreassignProduct(createContext, createPath);
					dialog.close();
					if (reassignProductBox) {
						reassignProductBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Insert Product Confirmation Box**//
	var onConfirmDialoginsertProduct = function (createContext, createPath) {
		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var Product = createContext.getProperty(createPath + '/Product');
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-insert', {
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

						new sap.m.Label({
							text: 'Assign Product'
						}),
						new sap.m.Text({
							text: Product
						}),
						new sap.m.Label({
							text: 'To Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						})
					]

				}),
				new sap.m.Text({
					text: 'This action adds the selected product to the release package, please confirm'

				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangesinsertProduct(createContext, createPath);
					dialog.close();
					if (insertProductBox) {
						insertProductBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Remove Product Confirmation Box**//
	var onConfirmDialogremoveProduct = function (removeData) {
		var RPDescFormattedText = '<strong>' + 'Release Package Name' + '</strong>';
		var ProductFormattedText = '<strong>' + 'Product' + '</strong>';
		if (removeData.length >= 1) {
			removeData.forEach(function (aData) {
				RPDescFormattedText = RPDescFormattedText + '<li>' + aData.RPDesc + '</li>';
				ProductFormattedText = ProductFormattedText + '<li>' + aData.Product + '</li>';
			});

		}
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-remove', {
					editable: false,
					width: "750px",
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

						new FormattedTextView('ProductHTMLText', {
							htmlText: ProductFormattedText
						}),

						new FormattedTextView('RPDescHTMLText', {
							htmlText: RPDescFormattedText
						})

					]

				}),
				new sap.m.Text({
					text: 'This action removes the product(s) from the release package selected, please confirm'

				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangesremoveProduct(removeData);
					dialog.close();
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Add Existing N Rank Confirmation Box**//
	var onConfirmDialog = function (createContext, createPath) {
		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var RPVersion = createContext.getProperty(createPath + '/RPVersion');
		var ServFlag = createContext.getProperty(createPath + '/ServFlag');
		var GADate = createContext.getProperty(createPath + '/GADate');

		// SAPUI5 Date formatters
		var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "MM/dd/yyyy",
			UTC: true
		});
		var dateStr = dateFormat.format(new Date(GADate)); //05-12-2012

		//shipToNameFormattedText=shipToNameFormattedText+'</ul>';
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-existing', {
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

						new sap.m.Label({
							text: 'Add Version'
						}),
						new sap.m.Text({
							text: RPVersion
						}),
						new sap.m.Label({
							text: 'For the Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						}),
						new sap.m.Label({
							text: 'N Ranking'
						}),
						new sap.m.Text({
							text: 'Part of existing n version'
						}),

						new sap.m.Label({
							text: 'GA Date'
						}),
						new sap.m.Text({
							text: dateStr
						})

					]

				}),
				new sap.m.Text({
					text: 'This action adds a  new version to the release package selected, please confirm'
						//width: '100%'
				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChanges(createContext, createPath);
					dialog.close();
					if (addExistingBox) {
						addExistingBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Add New N Rank Confirmation Box**//
	var onConfirmDialogNew = function (createContext, createPath) {

		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var RPVersion = createContext.getProperty(createPath + '/RPVersion');
		var ServFlag = createContext.getProperty(createPath + '/ServFlag');
		var GADate = createContext.getProperty(createPath + '/GADate');

		// SAPUI5 Date formatters
		var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "MM/dd/yyyy",
			UTC: true
		});
		var dateStr = dateFormat.format(new Date(GADate)); //05-12-2012

		//shipToNameFormattedText//** Add Existing N Rank Confirmation Box**//=shipToNameFormattedText+'</ul>';
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-new', {
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

						new sap.m.Label({
							text: 'Add Version'
						}),
						new sap.m.Text({
							text: RPVersion
						}),
						new sap.m.Label({
							text: 'For the Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						}),
						new sap.m.Label({
							text: 'N Ranking'
						}),
						new sap.m.Text({
							text: 'New n version'
						}),

						new sap.m.Label({
							text: 'GA Date'
						}),
						new sap.m.Text({
							text: dateStr
						})

					]

				}),
				new sap.m.Text({
					text: 'This action adds a  new version to the release package selected, please confirm'
						//width: '100%'
				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangesNew(createContext, createPath);
					dialog.close();
					if (createNewBox) {
						createNewBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Add Between N Rank Confirmation Box**//
	var onConfirmDialogBetween = function (createContext, createPath) {
		var RPDesc = createContext.getProperty(createPath + '/RPDesc');
		var RPVersion = createContext.getProperty(createPath + '/RPVersion');
		var ServFlag = createContext.getProperty(createPath + '/ServFlag');
		var NRank = createContext.getProperty(createPath + '/NRank');
		var GADate = createContext.getProperty(createPath + '/GADate');

		// SAPUI5 Date formatters
		var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "MM/dd/yyyy",
			UTC: true
		});
		var dateStr = dateFormat.format(new Date(GADate)); //05-12-2012

		//shipToNameFormattedText=shipToNameFormattedText+'</ul>';
		var dialog = new sap.m.Dialog({
			title: 'Please Confirm Change',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm('confirm-form-between', {
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

						new sap.m.Label({
							text: 'Add Version'
						}),
						new sap.m.Text({
							text: RPVersion
						}),
						new sap.m.Label({
							text: 'For the Release Package'
						}),
						new sap.m.Text({
							text: RPDesc
						}),
						new sap.m.Label({
							text: 'N Ranking'
						}),
						new sap.m.Text({
							text: NRank
						}),

						new sap.m.Label({
							text: 'GA Date'
						}),
						new sap.m.Text({
							text: dateStr
						})

					]

				}),
				new sap.m.Text({
					text: 'This action adds a  new version to the release package selected, please confirm'

				})
			],
			beginButton: new sap.m.Button({
				text: 'Confirm',
				press: function () {
					submitChangesBetween(createContext, createPath);
					dialog.close();
					if (createBetweenBox) {
						createBetweenBox.close();
					}
				}
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {

					dialog.close();
				}
			}),
			afterClose: function () {

				dialog.destroy();
			}
		});

		dialog.open();
	};

	//** Reassign Product Dialog Box**//
	var reAssign = function (createContext, createPath) {
		reassignProductBox = new sap.m.Dialog({

			title: 'Reassign Product',
			draggable: true,
			content: new sap.ui.layout.form.SimpleForm('new-entry-form-reassign', {
				editable: true,
				layout: "ResponsiveGridLayout",
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
					new sap.m.Label('Release-Package-label-re', {
						text: 'From Release Package',
						required: true
					}),

					new sap.m.Input('Release-Package-input-re', {
						value: {
							path: createPath + '/RPDesc'
						},
						enabled: false
					}),

					new sap.m.Label('Product-label-re', {
						text: 'Product',
						required: true
					}),
					new sap.m.Input('Product-input-re', {
						value: {
							path: createPath + '/Product'
						},
						enabled: false
					}),

					new sap.m.Label('Release-Package-to-label-re', {
						text: 'To Release Package',
						required: true
					}),

					relPackDropDownTo('Release-Package-to-input-re', createPath)
				]
			}),

			beginButton: new sap.m.Button({
				text: 'Save',
				//Enable if the mandatory fields are filled				
				enabled: {
					parts: [
						createPath + '/RPDesc',
						createPath + '/Product',
						createPath + '/RPDescTo'
					],
					formatter: function (RPDesc, Product, RPDescTo) {
						return (RPDesc ? true : false) && (Product ? true : false) && (RPDescTo ? true : false);
					}
				},
				press: function () {
					onConfirmDialogreassignProduct(createContext, createPath);
				}.bind(this)
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					reassignProductBox.close();
				}.bind(this)
			}),
			afterClose: function () {
				oModel.deleteCreatedEntry(createContext);
				if (reassignProductBox) {
					reassignProductBox.destroy();
				}
			}
		});
		oMainView.addDependent(reassignProductBox);
		reassignProductBox.open();
	};

	//**Add to Existing N Ranking Dialog Box**//
	var addExisting = function () {

		var createContext = oModel.createEntry("/RPVersionMasterSet", {
			properties: {
				RPDesc: filterInfo.RPDesc,
				RPVersion: '',
				ServFlag: 'Y',
				GADate: ''
			}
		});

		var createPath = createContext.getPath();

		addExistingBox = new sap.m.Dialog({

			title: 'Add Release Package Version',
			draggable: true,
			content: new sap.ui.layout.form.SimpleForm('new-entry-form-existing', {
				editable: true,
				layout: "ResponsiveGridLayout",
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
					new sap.m.Label('Release-Package-label-ex', {
						text: 'Release Package Name',
						required: true
					}),

					relPackDropDown('Release-Package-input-ex', createPath),
					new sap.m.Label('Version-label-ex', {
						text: 'Version',
						required: true
					}),
					new sap.m.Input('Version-input-ex', {
						value: {
							path: createPath + '/RPVersion'
						},
						required: true
					}),
					new sap.m.Label('Serviceable-label-ex', {
						text: 'Serviceable',
						required: true
					}),
					serviceableFlag('Serviceable-input-ex', createPath),

					new sap.m.Label('GADate-label-ex', {
						text: 'GADate'
					}),

					new sap.m.DatePicker('GADate-input-ex', {
						id: 'DP1',

						value: {
							path: createPath + '/GADate',
							type: 'sap.ui.model.type.Date',
							formatOptions: {
								pattern: 'MM/dd/yyyy',
								strictParsing: true,
								UTC: true,
								nullable: true

							}
						}

					})

				]
			}),

			beginButton: new sap.m.Button({
				text: 'Save',
				//Enable if the mandatory fields are filled				
				enabled: {
					parts: [
						createPath + '/RPDesc',
						createPath + '/RPVersion',
						createPath + '/ServFlag',
						createPath + '/GADate'
					],
					formatter: function (RPDesc, RPVersion, ServFlag) {
						return (RPDesc ? true : false) && (RPVersion ? true : false) && (ServFlag ? true : false);
					}
				},
				press: function () {
					onConfirmDialog(createContext, createPath);
				}.bind(this)
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					addExistingBox.close();
				}.bind(this)
			}),
			afterClose: function () {
				oModel.deleteCreatedEntry(createContext);
				if (addExistingBox) {
					addExistingBox.destroy();
				}
			}
		});
		oMainView.addDependent(addExistingBox);
		addExistingBox.open();
	};

	//** Add New N Rank Dialog Box**//
	var createNew = function () {

		var createContext = oModel.createEntry("/RPVersionMasterSet", {
			properties: {
				RPDesc: filterInfo.RPDesc,
				RPVersion: '',
				ServFlag: 'Y',
				GADate: ''
			}
		});

		var createPath = createContext.getPath();

		createNewBox = new sap.m.Dialog({

			title: 'Add Release Package Version',
			draggable: true,
			content: new sap.ui.layout.form.SimpleForm('new-entry-form-new', {
				editable: true,
				layout: "ResponsiveGridLayout",
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
					new sap.m.Label('Release-Package-label-new', {
						text: 'Release Package Name',
						required: true
					}),

					relPackDropDown('Release-Package-input-new', createPath),
					new sap.m.Label('Version-label-new', {
						text: 'Version',
						required: true
					}),
					new sap.m.Input('Version-input-new', {
						value: {
							path: createPath + '/RPVersion'
						},
						required: true
					}),
					new sap.m.Label('Serviceable-label-new', {
						text: 'Serviceable',
						required: true
					}),
					serviceableFlag('Serviceable-input-new', createPath),

					new sap.m.Label('GADate-label-new', {
						text: 'GADate'
					}),

					new sap.m.DatePicker('GADate-input-new', {
						id: 'DP1',

						value: {
							path: createPath + '/GADate',
							type: 'sap.ui.model.type.Date',
							formatOptions: {
								pattern: 'MM/dd/yyyy',
								strictParsing: true,
								UTC: true,
								nullable: true

							}
						}

					})

				]
			}),

			beginButton: new sap.m.Button({
				text: 'Save',
				//Enable if the mandatory fields are filled				
				enabled: {
					parts: [
						createPath + '/RPDesc',
						createPath + '/RPVersion',
						createPath + '/ServFlag',
						createPath + '/GADate'
					],
					formatter: function (RPDesc, RPVersion, ServFlag) {
						return (RPDesc ? true : false) && (RPVersion ? true : false) && (ServFlag ? true : false);
					}
				},
				press: function () {
					onConfirmDialogNew(createContext, createPath);
				}.bind(this)
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					createNewBox.close();
				}.bind(this)
			}),
			afterClose: function () {
				oModel.deleteCreatedEntry(createContext);
				if (createNewBox) {
					createNewBox.destroy();
				}
			}
		});
		oMainView.addDependent(createNewBox);
		createNewBox.open();
	};

	//** Add In Between N Rank Dialog Box**//
	var createBetween = function () {

		var createContext = oModel.createEntry("/RPVersionMasterSet", {
			properties: {
				RPDesc: filterInfo.RPDesc,
				RPVersion: '',
				ServFlag: 'Y',
				NRank: '',
				GADate: ''
			}
		});

		var createPath = createContext.getPath();

		createBetweenBox = new sap.m.Dialog({

			title: 'Add Release Package Version',
			draggable: true,
			content: new sap.ui.layout.form.SimpleForm('new-entry-form-bet', {
				editable: true,
				layout: "ResponsiveGridLayout",
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
					new sap.m.Label('Release-Package-label-bet', {
						text: 'Release Package Name',
						required: true
					}),

					relPackDropDown('Release-Package-input-bet', createPath),
					new sap.m.Label('Version-label', {
						text: 'Version',
						required: true
					}),
					new sap.m.Input('Version-input-bet', {
						value: {
							path: createPath + '/RPVersion'
						},
						required: true
					}),
					new sap.m.Label('Serviceable-label-bet', {
						text: 'Serviceable',
						required: true
					}),
					serviceableFlag('Serviceable-input-bet', createPath),

					new sap.m.Label('NRank-label-bet', {
						text: 'NRank',
						required: true
					}),
					nRank('NRank-input-bet', createPath),

					new sap.m.Label('GADate-label-bet', {
						text: 'GADate'
					}),

					new sap.m.DatePicker('GADate-input-bet', {
						id: 'DP1',

						value: {
							path: createPath + '/GADate',
							type: 'sap.ui.model.type.Date',
							formatOptions: {
								pattern: 'MM/dd/yyyy',
								strictParsing: true,
								UTC: true,
								nullable: true

							}
						}

					})

				]
			}),

			beginButton: new sap.m.Button({
				text: 'Save',
				//Enable if the mandatory fields are filled				
				enabled: {
					parts: [
						createPath + '/RPDesc',
						createPath + '/RPVersion',
						createPath + '/ServFlag',
						createPath + '/NRank',
						createPath + '/GADate'
					],
					formatter: function (RPDesc, RPVersion, ServFlag, NRank) {
						return (RPDesc ? true : false) && (RPVersion ? true : false) && (ServFlag ? true : false) && (NRank ? true : false);
					}
				},
				press: function () {
					onConfirmDialogBetween(createContext, createPath);
				}.bind(this)
			}),
			endButton: new sap.m.Button({
				text: 'Cancel',
				press: function () {
					createBetweenBox.close();
				}.bind(this)
			}),
			afterClose: function () {
				oModel.deleteCreatedEntry(createContext);
				if (createBetweenBox) {
					createBetweenBox.destroy();
				}
			}
		});
		oMainView.addDependent(createBetweenBox);
		createBetweenBox.open();
	};

	//** Serviceable Update Complete Box - Final**//
	var onserviceableUpdateComplete = function (updateEntities) {
		var successMessage = "";
		if (updateEntities.length > 0) {
			successMessage = successMessage + "<p><strong>Update Status:</strong></p>\n";
			updateEntities.forEach(function (entity) {
				successMessage = successMessage + "<li>Release Package Name: " + entity.entity.RPDesc + ", Version: " + entity.entity.RPVersion +
					", Update Status: " + entity.resp + "</li>";
			});
		}
		console.log("update complate", successMessage);
		var dialog = new sap.m.Dialog({
			title: 'Update Status',
			type: 'Message',
			draggable: true,
			content: [
				new sap.ui.layout.form.SimpleForm({
					width: "610px",
					editable: false,
					layout: "ResponsiveGridLayout",
					labelSpanXL: 3,
					labelSpanL: 4,
					labelSpanM: 5,
					labelSpanS: 12,
					adjustLabelSpan: false,
					emptySpanXL: 0,
					emptySpanL: 0,
					emptySpanM: 0,
					emptySpanS: 0,
					columnsXL: 1,
					columnsL: 1,
					columnsM: 1,
					singleContainerFullSize: false,
					content: [
						new FormattedTextView('statusText', {
							htmlText: successMessage
						})

					]
				})

			],
			endButton: new sap.m.Button({
				text: 'Ok',
				press: function () {
					dialog.close();
				}
			}),
			afterClose: function () {
				dialog.destroy();
			}
		});

		dialog.open();

	};

	var CController = Controller.extend("ZAS_VERSION_MASTER.zas_version_master.Main", {
		onInit: function () {
			oMainView = this.getView();
			var oTableMatMas = oMainView.byId("smartTable0");
			var oTableRelPkg = oMainView.byId("smartTable1");

			oModel = this.getOwnerComponent().getModel();

			oModel.setSizeLimit(750);

			oModel.attachMetadataLoaded(oModel, function () {
				oMainView.setModel(oModel);
			});
			oTableMatMas.attachInitialise(function () {
				var columns = oTableMatMas.getTable().getColumns();
				oTableMatMas.getTable().setEnableSelectAll(false);

				columns.forEach(function (c) {
					c.setShowFilterMenuEntry(false);
					c.setWidth("260px");
				});

				// <!--Begin of insert by vijay on 05/14/2020 - 7000001467 - To set the tool tip-->
				// oTableMatMas.getCustomToolbar().getAggregation('content').forEach(function (element) {
				// 	if (element.sId && element.sId.indexOf("btnExcelExport") > -1) {
				// 		element.setTooltip("Export Selected Release Package");
				// 	}
				// });
				// <!--End of insert by vijay on 05/14/2020-->
			});

			oTableMatMas.attachAfterVariantApply(function () {

				var columns = oTableMatMas.getTable().getColumns();

				columns.forEach(function (c) {
					c.setWidth("260px");
				});

			});

			oTableRelPkg.attachInitialise(function () {
				var columns = oTableRelPkg.getTable().getColumns();
				var tableId = oTableRelPkg.sId;
				oTableRelPkg.getTable().setEnableSelectAll(false);

				columns.forEach(function (c) {
					c.setShowFilterMenuEntry(false);
					c.setWidth("280px");
				});

				columns.filter(function (c) {
					return c.getId() === tableId + '-ServFlag';
				}).forEach(function (c) {
					var field = serviceableFlag();
					c.setTemplate(field);
				});

				// <!--Begin of insert by vijay on 05/14/2020 - 7000001467 - To set the tool tip-->
				// oTableRelPkg.getCustomToolbar().getAggregation('content').forEach(function (element) {
				// 	if (element.sId && element.sId.indexOf("btnExcelExport") > -1) {
				// 		element.setTooltip("Export Selected Release Package");
				// 	}
				// });
				// <!--End of insert by vijay on 05/14/2020-->

			});

			oTableRelPkg.attachAfterVariantApply(function () {

				var columns = oTableRelPkg.getTable().getColumns();

				columns.forEach(function (c) {
					c.setWidth("280px");
				});

			});

		},
		//** Oncick Radio Button **//
		onSelectRadio: function (oEvent) {
			var matMasFilter = oMainView.byId("matMasFilter");
			var relPkgFilter = oMainView.byId("relPkgVerFilter");
			var relPkgTable = oMainView.byId("relPkgVerTable");
			var matMasTable = oMainView.byId("matMasTable");
			if (oEvent.getSource().getSelectedIndex()) {
				relPkgFilter.setVisible(true);
				matMasFilter.setVisible(false);
				relPkgTable.setVisible(true);
				matMasTable.setVisible(false);
			} else {
				relPkgFilter.setVisible(false);
				matMasFilter.setVisible(true);
				relPkgTable.setVisible(false);
				matMasTable.setVisible(true);
			}
		},

		//**Set Serviceable flag**//
		setServiceableFlag: function () {
			var changedEntities = oModel.getPendingChanges();
			var updateEntities = [];
			var changeLength = Object.keys(changedEntities).length;
			console.log(changedEntities);
			for (var i = 0; i < changeLength; i++) {
				var changedModelEntity = {};
				changedModelEntity.entity = oModel.getProperty("/" + Object.keys(changedEntities)[i]);
				changedModelEntity.resp = "";
				changedModelEntity.changeId = i;
				updateEntities.push(changedModelEntity);
			}
			try {
				updateEntities.forEach(function (updateEntity) {

					sap.ui.core.BusyIndicator.show();

					var aUrlParams = {
						"RPDesc": updateEntity.entity.RPDesc,
						"RPVersion": updateEntity.entity.RPVersion,
						"ServFlag": updateEntity.entity.ServFlag
					};
					//console.log(aUrlParams);
					oModel.callFunction("/SetServiceableFlag", { // function import name
						"method": "POST",
						changeSetId: updateEntity.changeId,
						"urlParameters": aUrlParams, // function import parameters
						success: function (oData, response) {
							//		          //Short circuit evaluation to check if 'Comments' is an attribute:
							changeLength--;
							if (oData.Identifier && oData.Identifier === 2 && !oData.Success) {
								console.log(oData.Success);
								if (changeLength === 0) {
									sap.ui.core.BusyIndicator.hide();
									MessageBox.error(oData.Success);
									oModel.resetChanges();
									oModel.refresh();
								}

							} else if (oData.Identifier && oData.Identifier === 1 && !oData.Success) {
								updateEntity.resp = "Error";
								if (changeLength === 0) {
									sap.ui.core.BusyIndicator.hide();
									oModel.refresh();
									oModel.resetChanges();
									onserviceableUpdateComplete(updateEntities);
								}
							} else if (oData.Identifier && oData.Identifier === 1 && oData.Success) {
								updateEntity.resp = "Success";
								if (changeLength === 0) {
									sap.ui.core.BusyIndicator.hide();
									oModel.refresh();
									oModel.resetChanges();
									onserviceableUpdateComplete(updateEntities);
								}
							}

						}, // callback function for success
						error: function (oError) {
							changeLength--;
							updateEntity.resp = "Error";
							if (changeLength === 0) {
								sap.ui.core.BusyIndicator.hide();
								oModel.refresh();
								oModel.resetChanges();
								onserviceableUpdateComplete(updateEntities);
							}
						}
					});

				});
			} catch (e) {
				sap.ui.core.BusyIndicator.hide();
				MessageBox.error(e);
				oModel.resetChanges();
				updateEntities = [];
				return false;
			}

		},

		//** Add Release Package Version**//
		addReleasePackageVersion: function () {

			var oFilter = oMainView.byId("filterBar1");
			var filterData = oFilter.getFilterData();
			filterInfo.RPDesc = filterData["RPDesc"];
			MessageBox.show(
				"Please choose one option below to add the version", {
					icon: MessageBox.Icon.QUESTION,
					title: "Selection",
					styleClass: "messageBoxSize",
					actions: ["Add to n version", "New n version", "In Between version", MessageBox.Action.CANCEL],
					// emphasizedAction: "Add to n version",
					onClose: function (sAction) {

						if (sAction === 'Add to n version') {

							addExisting();

						} else if (sAction === 'New n version') {

							createNew();

						} else if (sAction === 'In Between version') {

							createBetween();

						}
					}
				}
			);
		},

		//** on click Create Release Package **//
		createReleasePkg: function () {
			var createContext = oModel.createEntry("/RPMaterialMasterSet", {
				properties: {
					RPDesc: '',
					BSegment: ''

				}
			});

			var createPath = createContext.getPath();

			createReleasePkgBox = new sap.m.Dialog({

				title: 'Create New Release Package',
				draggable: true,
				content: new sap.ui.layout.form.SimpleForm('new-entry-form', {
					editable: true,
					layout: "ResponsiveGridLayout",
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
						new sap.m.Label('Release-Package-label-rpg', {
							text: 'Release Package',
							required: true
						}),

						new sap.m.Input('Release-Package-input-rpg', {
							required: true,
							type: 'Text',
							placeholder: 'Name must not be empty. Maximum 40 characters.',
							// valueStateText: 'Name must not be empty. Maximum 40 characters.',
							// showValueStateMessage: true,
							// valueState: 'Error',
							value: {
								type: 'sap.ui.model.type.String',
								path: createPath + '/RPDesc'
									// constraints: {
									// 	minLength: 10,
									// 	maxLength: 40
									// }
							}

						}),
						new sap.m.Label('bsegment-label-rpg', {
							text: 'Business Segment',
							required: true
						}),
						businessSegment('bsegment-input-rpg', createPath)
					]
				}),

				beginButton: new sap.m.Button({
					text: 'Save',
					// Enable if the mandatory fields are filled				
					enabled: {
						parts: [
							createPath + '/RPDesc',
							createPath + '/BSegment'

						],
						formatter: function (RPDesc, BSegment) {
							return (RPDesc.length > 0 ? true : false) && (RPDesc.length <= 40 ? true : false) && (BSegment ? true : false);
						}
					},
					press: function () {
						onConfirmDialogcreateReleasePkg(createContext, createPath);
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function () {
						createReleasePkgBox.close();
					}.bind(this)
				}),
				afterClose: function () {
					oModel.deleteCreatedEntry(createContext);
					if (createReleasePkgBox) {
						createReleasePkgBox.destroy();
					}
				}
			});
			oMainView.addDependent(createReleasePkgBox);
			createReleasePkgBox.open();

		},

		//** on click Reassign Product **//
		reassignProduct: function () {
			var oTableMatMas = oMainView.byId("smartTable0");
			var oIndices = oTableMatMas.getTable().getSelectedIndices();
			if (oIndices.length > 1) {
				MessageBox.error("You cannot Reassign more than one product at a time. Please select only one record!!!");
			} else if (oIndices.length === 1) {
				var rowContext = oTableMatMas.getTable().getContextByIndex(oIndices.toString());
				var oVal = rowContext.oModel.getProperty(rowContext.sPath);
				filterInfo.RPDesc = oVal.RPDesc;
				var createContext = oModel.createEntry("/RPMaterialMasterSet", {
					properties: {
						RPDesc: oVal.RPDesc,
						Product: oVal.Product,
						RPDescTo: ''
					}
				});
				var createPath = createContext.getPath();
				reAssign(createContext, createPath);

			} else {
				MessageToast.show("Please select atleast one record to Reassign!!!");
			}

		},

		//** on click Insert Product **//
		insertProduct: function () {
			var oFilter = oMainView.byId("filterBar0");
			var filterData = oFilter.getFilterData();
			filterInfo.RPDesc = filterData["RPDesc"];
			var createContext = oModel.createEntry("/RPMaterialMasterSet", {
				properties: {
					RPDesc: filterInfo.RPDesc,
					Product: ''
				}
			});

			var createPath = createContext.getPath();

			insertProductBox = new sap.m.Dialog({

				title: 'Assign Product to a Release Package',
				draggable: true,
				content: new sap.ui.layout.form.SimpleForm('new-entry-form-in', {
					editable: true,
					layout: "ResponsiveGridLayout",
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
						new sap.m.Label('Release-Package-label-in', {
							text: 'Release Package',
							required: true
						}),

						relPackDropDown('Release-Package-input-in', createPath),

						new sap.m.Label('Product-label-in', {
							text: 'Product',
							required: true
						}),

						productList('Product-input-in', createPath)
					]
				}),

				beginButton: new sap.m.Button({
					text: 'Save',
					//Enable if the mandatory fields are filled				
					enabled: {
						parts: [
							createPath + '/RPDesc',
							createPath + '/Product'
						],
						formatter: function (RPDesc, Product) {
							return (RPDesc ? true : false) && (Product ? true : false);
						}
					},
					press: function () {
						onConfirmDialoginsertProduct(createContext, createPath);
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function () {
						insertProductBox.close();
					}.bind(this)
				}),
				afterClose: function () {
					oModel.deleteCreatedEntry(createContext);
					if (insertProductBox) {
						insertProductBox.destroy();
					}
				}
			});
			oMainView.addDependent(insertProductBox);
			insertProductBox.open();
		},

		//** on click Remove Product **//
		removeProduct: function () {
			var oTableMatMas = oMainView.byId("smartTable0");
			var oIndices = oTableMatMas.getTable().getSelectedIndices();
			var removeData = [];
			for (var i = 0; i < oIndices.length; i++) {
				var rowContext = oTableMatMas.getTable().getContextByIndex(oIndices[i]);
				removeData[i] = rowContext.oModel.getProperty(rowContext.sPath);
				removeData[i].resp = '';
				removeData[i].changeId = i;

			}
			if (removeData.length >= 1) {
				onConfirmDialogremoveProduct(removeData);
			} else {
				MessageToast.show("Please select atleast one record to remove!!!");
			}

		},

		clearFilter: function () {
			var oFilter = oMainView.byId("filterBar0");
			oFilter.clear();
		},
		clearRelPkgFilter: function () {
			var oFilter = oMainView.byId("filterBar1");
			oFilter.clear();
		},
		dataReceived: function (oEvent) {
				console.log(oEvent);
			}
			// <!--Begin of insert by vijay on 05/14/2020 - 7000001467 - To Enable Export All Functionality-->
			// matMas_exportAll: function (oEvent) {
			// 	var sUrl = oModel.sServiceUrl + "/MatMasRelPkgDataSet?$format=xlsx";
			// 	var encodeUrl = encodeURI(sUrl);
			// 	sap.m.URLHelper.redirect(encodeUrl, true);
			// },
			// rpg_exportAll: function (oEvent) {
			// 		var sUrl = oModel.sServiceUrl + "/ReleasePkgVersionDataSet?$format=xlsx";
			// 		var encodeUrl = encodeURI(sUrl);
			// 		sap.m.URLHelper.redirect(encodeUrl, true);
			// 	}
			// <!--End of insert by vijay on 05/14/2020-->

	});
	return CController;
});