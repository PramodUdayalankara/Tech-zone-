(function ($) {

    const BASE_URL = "http://localhost:8081";

    function log(msg, data){
        if(data) console.log("[OrderViewCtrl]", msg, data);
        else console.log("[OrderViewCtrl]", msg);
    }

    // ================= LOAD ALL ORDERS ===================
    function loadOrders(){

        const url = BASE_URL + "/api/orders";
        log("Loading orders from " + url);

        $.ajax({
            method:"GET",
            url:url,
            dataType:"json",

            success:function(resp){

                // resp is list[]
                log("Orders loaded", resp);

                $("#tblOrders").empty();

                resp.forEach(o => {

                    const id = o.id || o.orderId;
                    const date = o.date || o.orderDate;
                    const cust = o.customerId;
                    const total = o.total;

                    const row = `
                        <tr data-id="${id}">
                            <td>${id}</td>
                            <td>${date}</td>
                            <td>${cust}</td>
                            <td>${total}</td>
                        </tr>
                    `;

                    $("#tblOrders").append(row);
                });
            },

            error:function(xhr){
                alert("Orders load failed : " + xhr.status);
                console.error(xhr);
            }

        });
    }

    // ================= LOAD DETAILS ===================
    function loadDetails(orderId){

        const url = BASE_URL + "/api/orders/" + orderId;

        $.ajax({
            method:"GET",
            url:url,
            dataType:"json",

            success:function(resp){

                $("#tblOrderDetails").empty();

                resp.forEach(d => {
                    const code = d.itemId || d.itemCode;
                    const qty = d.qty;
                    const price = d.price || d.unitPrice;
                    const total = price * qty;

                    const row = `
                        <tr>
                            <td>${orderId}</td>
                            <td>${code}</td>
                            <td>${qty}</td>
                            <td>${total}</td>
                        </tr>
                    `;

                    $("#tblOrderDetails").append(row);
                });
            },

            error:function(xhr){
                alert("Order details load failed : " + xhr.status);
                console.error(xhr);
            }
        });

    }

    // ================= INIT ===================
    $(function(){

        log("Order view page init");

        loadOrders();

        // row click
        $("#tblOrders").on("click","tr",function(){

            $("#tblOrders tr").removeClass("table-active");
            $(this).addClass("table-active");

            const id = $(this).data("id");

            loadDetails(id);

        });

    });

})(jQuery);
