/**
 * DashboardController.js
 * Frontend AJAX / event wiring for POS UI (Spring Boot backend version)
 */

(function (window, $) {
  'use strict';

  // === BASE URL ===
  // index.html eke set kara thiyena window.__POS_BACKEND_URL__ eken gananawa
  // example: "http://localhost:8081/"
  const BASE_URL = (window.__POS_BACKEND_URL__ || 'http://localhost:8081/')
    .replace(/\/+$/, ''); // trailing / ain karanawa

  // REST API endpoints
  const CUSTOMER_API = BASE_URL + '/api/customers';
  const ITEM_API = BASE_URL + '/api/products';
  const ORDER_API = BASE_URL + '/api/orders';

  // footer eke URL display karanna
  const backendDisplay = document.getElementById('backendUrlDisplay');
  if (backendDisplay) {
    backendDisplay.textContent = BASE_URL + '/';
  }

  function debug(msg) {
    console.log(msg);
    const d = document.getElementById('debug');
    if (d) d.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  // ------------------------------------------------------------------
  //  DASHBOARD COUNTS
  // ------------------------------------------------------------------
  function loadCounts() {
    // Customers
    $.ajax({
      url: CUSTOMER_API,
      method: 'GET',
      success: function (res) {
        const list = Array.isArray(res) ? res : [];
        $('#txtCustomerCount').text(pad2(list.length));
      },
      error: function (xhr) {
        debug('CustomerCount error: ' + xhr.status);
      }
    });

    // Items
    $.ajax({
      url: ITEM_API,
      method: 'GET',
      success: function (res) {
        const list = Array.isArray(res) ? res : [];
        $('#txtItemsCount').text(pad2(list.length));
      },
      error: function (xhr) {
        debug('ItemCount error: ' + xhr.status);
      }
    });

    // Orders
    $.ajax({
      url: ORDER_API,
      method: 'GET',
      success: function (res) {
        const list = Array.isArray(res) ? res : [];
        $('#txtOrderCount').text(pad2(list.length));
      },
      error: function (xhr) {
        debug('OrderCount error: ' + xhr.status);
      }
    });
  }

  // ------------------------------------------------------------------
  //  CUSTOMERS (list / save / delete)
  // ------------------------------------------------------------------
  function loadCustomers() {
    $.ajax({
      url: CUSTOMER_API,
      method: 'GET',
      success: function (res) {
        const tbody = $('#customersTable tbody').empty();
        const list = Array.isArray(res) ? res : [];

        list.forEach(function (c) {
          // support a few possible property names safely
          const id =
            c.id || c.customerId || c.code || '';
          const name =
            c.name || c.customerName || c.fullName || '';

          const tr = $('<tr>');
          tr.append('<td>' + escapeHtml(id) + '</td>');
          tr.append('<td>' + escapeHtml(name) + '</td>');
          tr.append(
            '<td><button class="btn btn-sm btn-danger delete-cust">Delete</button></td>'
          );
          tr.data('id', id);
          tbody.append(tr);
        });
      },
      error: function (xhr) {
        debug('LoadCustomers error: ' + xhr.status);
      }
    });
  }

  function saveCustomer(e) {
    e.preventDefault();

    const id = $('#custId').val().trim();
    const name = $('#custName').val().trim();
    const address = $('#custAddress').val().trim() || '';
    const salary = $('#custSalary').val().trim() || 0;

    if (!id || !name) {
      alert('Enter ID and Name');
      return;
    }

    $.ajax({
      url: CUSTOMER_API,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        id: id,
        name: name,
        address: address,
        salary: salary
      }),
      success: function () {
        debug('Customer saved');
        $('#custId').val('');
        $('#custName').val('');
        loadCustomers();
        loadCounts();
      },
      error: function (xhr) {
        debug(
          'SaveCustomer error: ' + xhr.status + ' - ' + (xhr.responseText || '')
        );
      }
    });
  }

  function deleteCustomer(id) {
    if (!id) return;

    $.ajax({
      url: CUSTOMER_API + '/' + encodeURIComponent(id),
      method: 'DELETE',
      success: function () {
        debug('Customer deleted');
        loadCustomers();
        loadCounts();
      },
      error: function (xhr) {
        debug(
          'DeleteCustomer error: ' + xhr.status + ' - ' + (xhr.responseText || '')
        );
      }
    });
  }

  // ------------------------------------------------------------------
  //  ITEMS (list / save)
  // ------------------------------------------------------------------
  function loadItems() {
    $.ajax({
      url: ITEM_API,
      method: 'GET',
      success: function (res) {
        const tbody = $('#itemsTable tbody').empty();
        const list = Array.isArray(res) ? res : [];

        list.forEach(function (i) {
          const id = i.id || i.code || i.itemCode || '';
          const name = i.name || i.description || '';
          const qty = i.qty || i.qtyOnHand || '';
          const price = i.price || i.unitPrice || '';

          const tr = $('<tr>');
          tr.append('<td>' + escapeHtml(id) + '</td>');
          tr.append('<td>' + escapeHtml(name) + '</td>');
          tr.append('<td>' + escapeHtml(qty) + '</td>');
          tr.append('<td>' + escapeHtml(price) + '</td>');
          tbody.append(tr);
        });
      },
      error: function (xhr) {
        debug('LoadItems error: ' + xhr.status);
      }
    });
  }

  function saveItem(e) {
    e.preventDefault();

    const id = $('#itemId').val().trim();
    const name = $('#itemName').val().trim();
    const qty = $('#itemQty').val().trim() || 0;
    const price = $('#itemPrice').val().trim() || 0.0;

    if (!id || !name) {
      alert('Enter item ID and Name');
      return;
    }

    $.ajax({
      url: ITEM_API,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        id: id,
        name: name,
        qty: qty,
        price: price
      }),
      success: function () {
        debug('Item saved');
        $('#itemId').val('');
        $('#itemName').val('');
        loadItems();
        loadCounts();
      },
      error: function (xhr) {
        debug(
          'SaveItem error: ' + xhr.status + ' - ' + (xhr.responseText || '')
        );
      }
    });
  }

  // ------------------------------------------------------------------
  //  ORDERS (simple list for dashboard – optional)
  // ------------------------------------------------------------------
  function loadOrders() {
    // this will only affect pages that have #ordersTable
    $.ajax({
      url: ORDER_API,
      method: 'GET',
      success: function (res) {
        const tbody = $('#ordersTable tbody');
        if (!tbody.length) return; // no table on this page

        tbody.empty();
        const list = Array.isArray(res) ? res : [];

        list.forEach(function (o) {
          const id = o.id || o.orderId || '';
          const customer = o.customer || o.customerId || '';
          const total = o.total || o.totalAmount || '';
          const date = o.date || o.orderDate || '';

          const tr = $('<tr>');
          tr.append('<td>' + escapeHtml(id) + '</td>');
          tr.append('<td>' + escapeHtml(customer) + '</td>');
          tr.append('<td>' + escapeHtml(total) + '</td>');
          tr.append('<td>' + escapeHtml(date) + '</td>');
          tbody.append(tr);
        });
      },
      error: function (xhr) {
        debug('LoadOrders error: ' + xhr.status);
      }
    });
  }

  // ------------------------------------------------------------------
  //  UTIL
  // ------------------------------------------------------------------
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"'`=\/]/g, function (s) {
      return '&#' + s.charCodeAt(0) + ';';
    });
  }

  // ------------------------------------------------------------------
  //  INIT
  // ------------------------------------------------------------------
  $(function () {
    // initial loads (dashboard)
    loadCounts();
    loadCustomers();
    loadItems();
    loadOrders();

    // wire buttons / forms (if present on page)
    $('#loadCustomersBtn').on('click', loadCustomers);
    $('#loadItemsBtn').on('click', loadItems);
    $('#loadOrdersBtn').on('click', loadOrders);

    $('#customerForm').on('submit', saveCustomer);
    $('#itemForm').on('submit', saveItem);

    // delegated delete customer button
    $('#customersTable').on('click', '.delete-cust', function () {
      const id = $(this).closest('tr').data('id');
      if (!id) return;
      if (!confirm('Delete customer ' + id + '?')) return;
      deleteCustomer(id);
    });
  });

  // expose for console debugging
  window.POS = {
    loadCounts: loadCounts,
    loadCustomers: loadCustomers,
    loadItems: loadItems,
    loadOrders: loadOrders
  };
})(window, jQuery);
