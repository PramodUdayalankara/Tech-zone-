// controllers/ItemController.js
(function ($) {
    "use strict";

    // Backend base URL (browser walin set karala naththnam default)
    const BASE_URL = (window.__POS_BACKEND_URL__ || "http://localhost:8081")
        .replace(/\/+$/, "");              // trailing / ain karanawa
    const ITEM_API = BASE_URL + "/api/products";

    // ---------- helpers ----------
    function log(msg, obj) {
        if (obj !== undefined) {
            console.log("[ItemCtrl] " + msg, obj);
        } else {
            console.log("[ItemCtrl] " + msg);
        }
    }

    function normalizeList(data) {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.content)) return data.content;
        return [];
    }

    function showError(message) {
        alert(message || "Something went wrong");
    }

    // ---------- render table ----------
    function renderItems(items) {
        const $tbody = $("#ItemTable");
        $tbody.empty();

        if (!items || items.length === 0) {
            $tbody.append(
                "<tr><td colspan='4' class='text-center text-muted'>No items</td></tr>"
            );
            return;
        }

        items.forEach(i => {
            const code  = i.code || i.id || "";
            const name  = i.description || i.name || "";
            const qty   = i.qty != null ? i.qty : (i.qtyOnHand != null ? i.qtyOnHand : "");
            // price: support both unitPrice and price fields
            const price = (i.unitPrice != null
                ? i.unitPrice
                : (i.price != null ? i.price : "")
            );

            const $tr = $("<tr>");
            $tr.append($("<td>").text(code));
            $tr.append($("<td>").text(name));
            $tr.append($("<td>").text(qty));
            $tr.append($("<td>").text(price));

            $tr.on("click", function () {
                $("#txtItemID").val(code);
                $("#txtItemName").val(name);
                $("#txtItemQty").val(qty);
                $("#txtItemPrice").val(price);
            });

            $tbody.append($tr);
        });
    }

    // ---------- load all ----------
    function loadItems() {
        log("Loading items...");
        const url = ITEM_API;
        log("Requesting " + url);

        $.ajax({
            url: url,
            method: "GET",
            dataType: "json",
            success: function (resp) {
                log("RAW response", resp);
                const list = normalizeList(resp);
                log("Normalized item count = " + list.length);
                renderItems(list);
                log("Items loaded successfully from " + url);
            },
            error: function (xhr) {
                log("loadItems failed, status: " + xhr.status);
                $("#ItemTable")
                    .empty()
                    .append(
                        "<tr><td colspan='4' class='text-center text-danger'>Failed to load items (" +
                        xhr.status +
                        ")</td></tr>"
                    );
            }
        });
    }

    // ---------- form helpers ----------
    function getFormData() {
        const code  = $("#txtItemID").val().trim();
        const name  = $("#txtItemName").val().trim();
        const qty   = parseInt($("#txtItemQty").val().trim() || "0", 10);
        const price = parseFloat($("#txtItemPrice").val().trim() || "0");

        if (!code || !name) {
            showError("Please enter Item Code and Name");
            return null;
        }

        return {
            code: code,
            description: name,
            qty: qty,
            unitPrice: price,  // backend usually uses unitPrice
            price: price       // extra field, in case backend uses price
        };
    }

    function clearForm() {
        $("#txtItemID,#txtItemName,#txtItemQty,#txtItemPrice").val("");
    }

    // ---------- create ----------
    function saveItem() {
        const data = getFormData();
        if (!data) return;

        log("Saving item via POST", { url: ITEM_API, data: data });

        $.ajax({
            url: ITEM_API,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function () {
                log("Item saved");
                clearForm();
                loadItems();
            },
            error: function (xhr) {
                log("saveItem failed", xhr);
                showError("Save failed (" + xhr.status + ")");
            }
        });
    }

    // ---------- update ----------
    function updateItem() {
        const data = getFormData();
        if (!data) return;

        // NOTE: typical Spring controller uses PUT /api/products (without /code)
        log("Updating item via PUT", { url: ITEM_API, data: data });

        $.ajax({
            url: ITEM_API,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function () {
                log("Item updated");
                clearForm();
                loadItems();
            },
            error: function (xhr) {
                log("updateItem failed", xhr);
                showError("Update failed (" + xhr.status + ")");
            }
        });
    }

    // ---------- delete ----------
    function deleteItem() {
        const code = $("#txtItemID").val().trim();

        if (!code) {
            showError("Select an item first to delete");
            return;
        }

        if (!confirm("Delete item " + code + " ?")) return;

        // Typical Spring mapping: DELETE /api/products?code=I001
        const url = ITEM_API + "?code=" + encodeURIComponent(code);
        log("Deleting item via DELETE " + url);

        $.ajax({
            url: url,
            method: "DELETE",
            success: function () {
                log("Item deleted");
                clearForm();
                loadItems();
            },
            error: function (xhr) {
                log("deleteItem failed", xhr);
                showError("Delete failed (" + xhr.status + ")");
            }
        });
    }

    // ---------- init ----------
    $(function () {
        loadItems();

        $("#btnAddItem").off("click").on("click", function () {
            saveItem();
        });

        $("#btnUpdateItem").off("click").on("click", function () {
            updateItem();
        });

        $("#btnDeleteItem").off("click").on("click", function () {
            deleteItem();
        });
    });

})(jQuery);
