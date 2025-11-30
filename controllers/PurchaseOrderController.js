// controllers/PurchaseOrderController.js
(function ($) {
    "use strict";

    const BASE_URL = window.__POS_BACKEND_URL__ || "http://localhost:8081";

    let customers = [];
    let items = [];
    let cart = [];

    // --------- helpers ----------
    function log(msg, obj) {
        if (obj !== undefined) console.log("[OrderCtrl] " + msg, obj);
        else console.log("[OrderCtrl] " + msg);
    }

    function showError(msg) {
        alert(msg || "Something went wrong");
    }

    function findCustomerById(id) {
        return customers.find(c =>
            c.id === id ||
            c.customerId === id ||
            c.cid === id
        );
    }

    function findItemByCode(code) {
        return items.find(i =>
            (i.code || i.itemCode || i.id || i.productCode || i.productId) === code
        );
    }

    // ---------- load customers ----------
    function loadCustomers() {
        const url = BASE_URL + "/api/customers";
        log("Loading customers from " + url);

        $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            success: function (resp) {
                customers = Array.isArray(resp)
                    ? resp
                    : (resp.data || resp.content || []);
                log("Customers loaded", customers);
                renderCustomerSelect();
            },
            error: function (xhr) {
                log("loadCustomers failed", xhr);
                showError("Failed to load customers (" + xhr.status + ")");
            }
        });
    }

    function renderCustomerSelect() {
        const $sel = $("#cmbCustomerId");
        $sel.empty();

        $sel.append('<option value="">-- Select --</option>');

        customers.forEach(c => {
            const id = c.id || c.customerId || c.cid;
            const name = c.name || c.customerName || "";
            if (!id) return;
            $sel.append(
                $("<option>").val(id).text(id + " - " + name)
            );
        });

        if (customers.length > 0) {
            const firstId = customers[0].id || customers[0].customerId || customers[0].cid;
            $sel.val(firstId).trigger("change");
        }
    }

    // ---------- load items ----------
    function loadItems() {
        // oya backend eke item endpoint eka dan /api/products
        const url = BASE_URL + "/api/products";
        log("Loading items from " + url);

        $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            success: function (resp) {
                items = Array.isArray(resp)
                    ? resp
                    : (resp.data || resp.content || []);
                log("Items loaded", items);
                renderItemSelect();
            },
            error: function (xhr) {
                log("loadItems failed", xhr);
                showError("Failed to load items (" + xhr.status + ")");
            }
        });
    }

    function renderItemSelect() {
        const $sel = $("#cmbItemCode");
        $sel.empty();

        $sel.append('<option value="">-- Select --</option>');

        items.forEach(i => {
            // support various field names: code / itemCode / id / productCode / productId
            const code =
                i.code ||
                i.itemCode ||
                i.id ||
                i.productCode ||
                i.productId;

            const name =
                i.description ||
                i.name ||
                i.itemName ||
                i.productName;

            if (!code) return;
            $sel.append(
                $("<option>").val(code).text(code + " - " + (name || ""))
            );
        });

        if (items.length > 0) {
            const first =
                items[0].code ||
                items[0].itemCode ||
                items[0].id ||
                items[0].productCode ||
                items[0].productId;
            if (first) {
                $sel.val(first).trigger("change");
            }
        }
    }

    // ---------- UI: when customer changed ----------
    function handleCustomerChange() {
        const id = $("#cmbCustomerId").val();
        const c = findCustomerById(id);
        if (!c) {
            $("#customerName,#customerAddress,#customerSalary").val("");
            return;
        }

        $("#customerName").val(c.name || c.customerName || "");
        $("#customerAddress").val(c.address || c.customerAddress || "");
        $("#customerSalary").val(
            c.salary != null ? c.salary : (c.income != null ? c.income : "")
        );
    }

    // ---------- UI: when item changed ----------
    function handleItemChange() {
        const code = $("#cmbItemCode").val();
        const i = findItemByCode(code);
        if (!i) {
            $("#itemName,#itemPrice,#qtyOnHand").val("");
            return;
        }

        const name =
            i.description ||
            i.name ||
            i.itemName ||
            i.productName;

        const price =
            i.unitPrice != null ? i.unitPrice :
            (i.price != null ? i.price : i.unitPricePerQty);

        const qty =
            i.qty != null ? i.qty :
            (i.qtyOnHand != null ? i.qtyOnHand : i.quantity);

        $("#itemName").val(name || "");
        $("#itemPrice").val(price != null ? price : "");
        $("#qtyOnHand").val(qty != null ? qty : "");
    }

    // ---------- cart / totals ----------
    function renderCart() {
        const $tbody = $("#tblAddToCart");
        $tbody.empty();

        cart.forEach(line => {
            const $tr = $("<tr>");
            $tr.append($("<td>").text(line.code));
            $tr.append($("<td>").text(line.name));
            $tr.append($("<td>").text(line.price.toFixed(2)));
            $tr.append($("<td>").text(line.qty));
            $tr.append($("<td>").text(line.total.toFixed(2)));
            $tbody.append($tr);
        });

        updateTotals();
    }

    function updateTotals() {
        let total = 0;
        cart.forEach(l => total += l.total);
        $("#txtTotal").val(total.toFixed(2));

        let discount = parseFloat($("#txtDiscount").val() || "0");
        if (isNaN(discount) || discount < 0) discount = 0;
        if (discount > total) discount = total;

        const subTotal = total - discount;
        $("#txtSubTotal").val(subTotal.toFixed(2));

        updateBalance();
    }

    function updateBalance() {
        const subTotal = parseFloat($("#txtSubTotal").val() || "0");
        let cash = parseFloat($("#txtCash").val() || "0");

        if (isNaN(cash)) cash = 0;

        if (cash < subTotal) {
            $("#lblCheckSubtotal").text("Cash is not enough");
            $("#txtBalance").val("");
        } else {
            $("#lblCheckSubtotal").text("");
            const balance = cash - subTotal;
            $("#txtBalance").val(balance.toFixed(2));
        }
    }

    // ---------- Add to cart ----------
    function addToCart() {
        const code = $("#cmbItemCode").val();
        const item = findItemByCode(code);
        if (!item) {
            showError("Please select an item");
            return;
        }

        const name = $("#itemName").val();
        const price = parseFloat($("#itemPrice").val() || "0");
        let qtyOnHand = parseInt($("#qtyOnHand").val() || "0", 10);
        let buyQty = parseInt($("#buyQty").val() || "0", 10);

        if (!buyQty || buyQty <= 0) {
            $("#lblCheckQty").text("Invalid quantity");
            return;
        }

        const existing = cart.find(l => l.code === code);
        const existingQty = existing ? existing.qty : 0;

        if (buyQty + existingQty > qtyOnHand) {
            $("#lblCheckQty").text("Not enough stock");
            return;
        }
        $("#lblCheckQty").text("");

        if (existing) {
            existing.qty += buyQty;
            existing.total = existing.qty * price;
        } else {
            cart.push({
                code: code,
                name: name,
                price: price,
                qty: buyQty,
                total: buyQty * price
            });
        }

        qtyOnHand -= buyQty;
        $("#qtyOnHand").val(qtyOnHand);

        $("#buyQty").val("");

        renderCart();
    }

    // ---------- Clear All ----------
    function clearAll() {
        cart = [];
        $("#lblCheckQty,#lblCheckSubtotal").text("");
        $("#txtTotal,#txtDiscount,#txtSubTotal,#txtCash,#txtBalance").val("");
        $("#tblAddToCart").empty();
        $("#buyQty").val("");
        $("#orderDate").val("");
        renderCart();
    }

    // ---------- Purchase ----------
    function purchase() {
        if (cart.length === 0) {
            showError("Cart is empty");
            return;
        }

        const orderId = $("#orderId").val().trim();
        const orderDate = $("#orderDate").val().trim();
        const customerId = $("#cmbCustomerId").val();

        if (!orderDate || !customerId) {
            showError("Please select order date and customer");
            return;
        }

        const subTotal = parseFloat($("#txtSubTotal").val() || "0");
        const cash = parseFloat($("#txtCash").val() || "0");

        if (cash < subTotal) {
            showError("Cash is not enough");
            return;
        }

        const orderDetails = cart.map(l => ({
            itemCode: l.code,
            qty: l.qty,
            unitPrice: l.price
        }));

        const payload = {
            orderId: orderId,
            orderDate: orderDate,
            customerId: customerId,
            total: subTotal,
            orderDetails: orderDetails
        };

        const url = BASE_URL + "/api/orders";
        log("Placing order to " + url, payload);

        $.ajax({
            url: url,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function () {
                log("Order placed successfully");
                alert("Order placed successfully!");
                clearAll();
                loadItems();
            },
            error: function (xhr) {
                log("purchase failed", xhr);
                showError("Order failed (" + xhr.status + ")");
            }
        });
    }

    // ---------- init ----------
    $(function () {
        log("Order page init");

        const today = new Date().toISOString().slice(0, 10);
        $("#orderDate").val(today);

        loadCustomers();
        loadItems();

        $("#cmbCustomerId").on("change", handleCustomerChange);
        $("#cmbItemCode").on("change", handleItemChange);

        $("#btnAddToCart").on("click", addToCart);
        $("#btnClearAll").on("click", clearAll);
        $("#btnPurchase").on("click", function (e) {
            e.preventDefault();
            purchase();
        });

        $("#txtDiscount").on("input", updateTotals);
        $("#txtCash").on("input", updateBalance);
    });

})(jQuery);
