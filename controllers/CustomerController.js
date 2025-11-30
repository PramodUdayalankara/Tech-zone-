// controllers/CustomerController.js
(function (window, $) {
  'use strict';

  console.log('[CustomerCtrl] FILE VERSION v4 LOADED');

  const BASE_URL = (window.__POS_BACKEND_URL__ || 'http://localhost:8081/')
    .replace(/\/+$/, '');
  const CUSTOMER_API = BASE_URL + '/api/customers';

  // small helper
  function debug(msg) {
    console.log('[CustomerCtrl] ' + msg);
  }

  // render to customer.html main table
  function renderMainTable(customers) {
    const body = document.getElementById('customerTable');
    if (!body) return; // this page may not have main table

    let html = '';
    customers.forEach(c => {
      html += `
        <tr>
          <td>${escapeHtml(c.id || c.customerId || '')}</td>
          <td>${escapeHtml(c.name || c.customerName || '')}</td>
          <td>${escapeHtml(c.address || '')}</td>
          <td>${escapeHtml(c.salary || '')}</td>
        </tr>`;
    });
    body.innerHTML = html;
  }

  // render to index.html quick table
  function renderQuickTable(customers) {
    const quickBody = document.querySelector('#customersTable tbody');
    if (!quickBody) return; // index.html with quick panel only

    let html = '';
    customers.forEach(c => {
      html += `
        <tr>
          <td>${escapeHtml(c.id || c.customerId || '')}</td>
          <td>${escapeHtml(c.name || c.customerName || '')}</td>
          <td>
            <button class="btn btn-sm btn-danger quick-del" data-id="${escapeHtml(c.id || '')}">
              Delete
            </button>
          </td>
        </tr>`;
    });
    quickBody.innerHTML = html;
  }

  function loadCustomers() {
    debug('Loading customers...');
    $.ajax({
      url: CUSTOMER_API,
      method: 'GET',
      success: function (res) {
        const list = Array.isArray(res) ? res : [];
        debug('Loaded ' + list.length + ' customers');
        renderMainTable(list);
        renderQuickTable(list);
      },
      error: function (xhr) {
        debug('Load error ' + xhr.status);
      }
    });
  }

  function saveQuickCustomer(e) {
    if (e) e.preventDefault();
    const id = $('#custId').val().trim();
    const name = $('#custName').val().trim();
    if (!id || !name) {
      alert('Enter ID and Name');
      return;
    }
    $.ajax({
      url: CUSTOMER_API,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ id, name, address: '', salary: 0 }),
      success: function () {
        debug('Quick customer saved');
        $('#custId').val('');
        $('#custName').val('');
        loadCustomers();
        if (window.POS && window.POS.loadCounts) {
          window.POS.loadCounts();
        }
      },
      error: function (xhr) {
        debug('Save error ' + xhr.status + ' - ' + (xhr.responseText || ''));
      }
    });
  }

  function deleteQuickCustomer(id) {
    if (!id) return;
    $.ajax({
      url: CUSTOMER_API + '/' + encodeURIComponent(id),
      method: 'DELETE',
      success: function () {
        debug('Quick customer deleted');
        loadCustomers();
        if (window.POS && window.POS.loadCounts) {
          window.POS.loadCounts();
        }
      },
      error: function (xhr) {
        debug('Delete error ' + xhr.status + ' - ' + (xhr.responseText || ''));
      }
    });
  }

  function escapeHtml(text) {
    if (text == null) return '';
    return String(text).replace(/[&<>"'`=\/]/g, function (s) {
      return '&#' + s.charCodeAt(0) + ';';
    });
  }

  $(function () {
    debug('jQuery ready – init v4');
    loadCustomers();

    // quick customer form on index.html
    $('#customerForm').on('submit', saveQuickCustomer);

    // quick table delete
    $(document).on('click', '.quick-del', function () {
      const id = $(this).data('id');
      if (!id) return;
      if (!confirm('Delete customer ' + id + '?')) return;
      deleteQuickCustomer(id);
    });
  });

  window.CustomerCtrl = { loadCustomers };

})(window, jQuery);
