window.addEventListener("load", function(event) {

    document.getElementById("doit")
        .addEventListener("click", calculate);

});

function calculate() {

    let num1 = parseFloat(document.getElementById("num1").value);
    let num2 = parseFloat(document.getElementById("num2").value);
    let op = document.getElementById("operation").value;

    let result;

    if (op === "+") {
        result = num1 + num2;
    }
    else if (op === "-") {
        result = num1 - num2;
    }
    else if (op === "*") {
        result = num1 * num2;
    }
    else if (op === "/") {
        result = num1 / num2;
    }
    else if (op === "%") {
        result = num1 % num2;
    }

    document.getElementById("result").value = result;
}