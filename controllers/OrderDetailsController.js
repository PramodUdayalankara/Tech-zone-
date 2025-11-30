// controllers/OrderDetailsController.js
(function ($) {

    const BASE_URL = window.__POS_BACKEND_URL__ || "http://localhost:8081";

    function log(msg, obj) {
        if (obj !== undefined) console.log("[OrderDetailsCtrl] " + msg, obj);
        else console.log("[OrderDetailsCtrl] " + msg);
    }

    // =============== LOAD ALL ORDERS (TOP TABLE) ===============
    function loadOrders() {

        const url = BASE_URL + "/api/orders";
        log("Loading orders from " + url);

        $.ajax({
            method: "GET",
            url: url,
            dataType: "json",

            success: function (orders) {

                log("Orders loaded", orders);
                const $tbody = $("#tblOrders");
                $tbody.empty();

                (orders || []).forEach(o => {

                    // support both id/orderId and date/orderDate
                    const id   = o.id        || o.orderId   || "";
                    const date = o.date      || o.orderDate || "";
                    const cust = o.customerId || "";
                    const total = o.total != null ? o.total : "";

                    const row = `
                        <tr data-id="${id}">
                            <td>${id}</td>
                            <td>${date}</td>
                            <td>${cust}</td>
                            <td>${total}</td>
                        </tr>
                    `;

                    $tbody.append(row);
                });
            },

            error: function (xhr) {
                alert("Failed to load orders : " + xhr.status);
                console.error(xhr);
            }
        });
    }

    // =============== LOAD ORDER DETAILS (BOTTOM TABLE) ===============
    function loadOrderDetails(orderId) {

        const url = BASE_URL + "/api/orders/" + encodeURIComponent(orderId);
        log("Loading order details from " + url);

        $.ajax({
            method: "GET",
            url: url,
            dataType: "json",

            success: function (details) {

                const $tbody = $("#tblOrderDetails");
                $tbody.empty();

                (details || []).forEach(d => {

                    const itemCode = d.itemId || d.itemCode || "";
                    const qty = d.qty != null ? d.qty : "";
                    const unitPrice = parseFloat(d.price || d.unitPrice || 0);
                    const total = !isNaN(unitPrice) && qty !== ""
                        ? (unitPrice * qty).toFixed(2)
                        : "";

                    const row = `
                        <tr>
                            <td>${orderId}</td>
                            <td>${itemCode}</td>
                            <td>${qty}</td>
                            <td>${total}</td>
                        </tr>
                    `;
                    $tbody.append(row);
                });
            },

            error: function (xhr) {
                alert("Failed to load order details : " + xhr.status);
                console.error(xhr);
            }
        });
    }

    // ======================= INIT =======================
    $(function () {

        log("Order details page init");
        loadOrders();

        // click order row → load details
        $("#tblOrders").on("click", "tr", function () {

            $("#tblOrders tr").removeClass("table-active");
            $(this).addClass("table-active");

            const orderId = $(this).data("id");   // comes from <tr data-id="...">
            if (!orderId) return;

            loadOrderDetails(orderId);
        });
    });

})(jQuery);
