/* app.frontend.js
   Single consolidated frontend controller for the POS sample.
   Make sure this file is saved as: FrontEnd-POS/js/app.frontend.js
*/

(function($){
  "use strict";

  // Adjust baseUrl if you change backend port/context
  const baseUrl = "http://localhost:8081/Pos_JavaEE/";

  // Generic AJAX wrapper with JSON handling and error logs
  function ajaxRequest({ url, method="GET", data=null, success, error, contentType="application/json; charset=utf-8" }){
    const settings = {
      url: url,
      method: method,
      contentType: contentType,
      dataType: "json",
      cache: false,
      success: function(resp){
        console.log("AJAX success:", url, resp);
        if (typeof success === "function") success(resp);
      },
      error: function(xhr, status, err){
        console.error("AJAX error:", url, status, err, xhr.responseText);
        let msg = `Request failed: ${status} ${err}`;
        if (xhr && xhr.responseText) {
          msg += ` - ${xhr.responseText}`;
        }
        if (typeof error === "function") error(xhr, status, err);
        // show debug message
        $("#debug").text(msg);
      }
    };
    if (data !== null) {
      // if data is object and contentType is json, stringify
      if (contentType && contentType.indexOf("application/json") === 0 && typeof data === "object") {
        settings.data = JSON.stringify(data);
      } else {
        settings.data = data;
      }
    }
    $.ajax(settings);
  }

  // Helper to build REST endpoint
  function apiPath(path) {
    // ensure trailing slash single
    if (!baseUrl.endsWith("/")) return baseUrl + "/" + path;
    return baseUrl + path;
  }

  // Customers
  function loadCustomers(){
    const url = apiPath("customer?option=GetAll"); // adapt if backend expects different option
    ajaxRequest({
      url: url,
      method: "GET",
      success: function(resp){
        renderCustomers(resp);
      }
    });
  }

  function saveCustomer(){
    // gather values from form
    const id = $("#custId").val().trim();
    const name = $("#custName").val().trim();
    const address = $("#custAddress").val().trim();
    if (!id || !name) {
      alert("Please provide at least ID and Name for customer.");
      return;
    }
    // backend may expect form data or JSON; try JSON first
    const payload = { id: id, name: name, address: address };
    const url = apiPath("customer");
    ajaxRequest({
      url: url + "?option=SaveCustomer",
      method: "POST",
      data: payload,
      success: function(resp){
        $("#debug").text("Customer saved.");
        clearCustomerForm();
        loadCustomers();
      },
      error: function(){ $("#debug").text("Failed to save customer."); }
    });
  }

  function deleteCustomer(id){
    if(!confirm("Delete customer " + id + "?")) return;
    const url = apiPath("customer?option=Delete&customerId=" + encodeURIComponent(id));
    ajaxRequest({
      url: url,
      method: "DELETE",
      success: function(){ loadCustomers(); }
    });
  }

  function renderCustomers(data){
    // expected data: array of customers
    const tbody = $("#customersTable tbody").empty();
    if (!Array.isArray(data)) {
      // try to support object with property
      if (data && data.data) data = data.data;
      else data = [];
    }
    data.forEach(c => {
      const tr = $("<tr>");
      tr.append($("<td>").text(c.id || c.customerId || ""));
      tr.append($("<td>").text(c.name || c.customerName || ""));
      tr.append($("<td>").text(c.address || ""));
      const actions = $("<td>");
      actions.append($("<button>").addClass("btn btn-sm btn-danger me-1").text("Delete")
        .on("click", function(){ deleteCustomer(c.id || c.customerId); }));
      actions.append($("<button>").addClass("btn btn-sm btn-secondary").text("Load")
        .on("click", function(){ $("#custId").val(c.id || c.customerId); $("#custName").val(c.name || c.customerName); $("#custAddress").val(c.address || ""); }));
      tr.append(actions);
      tbody.append(tr);
    });
  }

  function clearCustomerForm(){
    $("#custId,#custName,#custAddress").val("");
  }

  // Items
  function loadItems(){
    const url = apiPath("item?option=GetAll");
    ajaxRequest({ url: url, method: "GET", success: function(resp){ renderItems(resp); }});
  }

  function saveItem(){
    const id = $("#itemId").val().trim();
    const name = $("#itemName").val().trim();
    const qty = $("#itemQty").val().trim();
    const price = $("#itemPrice").val().trim();
    if (!id || !name) { alert("Provide item id & name"); return; }
    const payload = { id:id, name:name, qty: qty, price: price };
    ajaxRequest({
      url: apiPath("item?option=SaveItem"),
      method: "POST",
      data: payload,
      success: function(){ $("#debug").text("Item saved"); loadItems(); clearItemForm(); }
    });
  }

  function deleteItem(id){
    if(!confirm("Delete item "+id+"?")) return;
    ajaxRequest({ url: apiPath("item?option=Delete&itemId="+encodeURIComponent(id)), method: "DELETE", success: loadItems });
  }

  function renderItems(data){
    const tbody = $("#itemsTable tbody").empty();
    if (!Array.isArray(data)) {
      if (data && data.data) data = data.data;
      else data = [];
    }
    data.forEach(i=>{
      const tr = $("<tr>");
      tr.append($("<td>").text(i.id || i.itemId || ""));
      tr.append($("<td>").text(i.name || i.description || ""));
      tr.append($("<td>").text(i.qty || i.quantity || ""));
      tr.append($("<td>").text(i.price || ""));
      const actions = $("<td>");
      actions.append($("<button>").addClass("btn btn-sm btn-danger me-1").text("Delete").on("click",()=>deleteItem(i.id || i.itemId)));
      actions.append($("<button>").addClass("btn btn-sm btn-secondary").text("Load").on("click",()=>{
        $("#itemId").val(i.id || i.itemId); $("#itemName").val(i.name || i.description); $("#itemQty").val(i.qty || i.quantity); $("#itemPrice").val(i.price || "");
      }));
      tr.append(actions);
      tbody.append(tr);
    });
  }

  function clearItemForm(){ $("#itemId,#itemName,#itemQty,#itemPrice").val(""); }

  // Orders (read-only quick)
  function loadOrders(){
    const url = apiPath("order?option=GetAll");
    ajaxRequest({ url: url, method: "GET", success: function(resp){ renderOrders(resp); }});
  }

  function renderOrders(data){
    const tbody = $("#ordersTable tbody").empty();
    if (!Array.isArray(data)) {
      if (data && data.data) data = data.data;
      else data = [];
    }
    data.forEach(o=>{
      const tr = $("<tr>");
      tr.append($("<td>").text(o.id || o.orderId || ""));
      tr.append($("<td>").text(o.customerName || o.customer || ""));
      tr.append($("<td>").text(o.total || o.amount || ""));
      tr.append($("<td>").text(o.date || ""));
      tbody.append(tr);
    });
  }

  // Document ready: bind buttons & forms
  $(function(){
    console.info("Frontend app initializing, baseUrl=", baseUrl);

    // Customers
    $("#loadCustomersBtn").on("click", function(e){ e.preventDefault(); loadCustomers(); });
    $("#saveCustomerBtn").on("click", function(e){ e.preventDefault(); saveCustomer(); });
    $("#clearCustomerBtn").on("click", function(){ clearCustomerForm(); });

    $("#customerForm").on("submit", function(e){ e.preventDefault(); saveCustomer(); });

    // Items
    $("#loadItemsBtn").on("click", function(e){ e.preventDefault(); loadItems(); });
    $("#saveItemBtn").on("click", function(e){ e.preventDefault(); saveItem(); });
    $("#itemForm").on("submit", function(e){ e.preventDefault(); saveItem(); });

    // Orders
    $("#loadOrdersBtn").on("click", function(e){ e.preventDefault(); loadOrders(); });

    // Auto-load lists on page load (optional)
    loadCustomers();
    loadItems();
    loadOrders();
  });

})(jQuery);

