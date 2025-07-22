const URL_BASE = "https://goalify.develotion.com/";

inicio();

function inicio(){
    document.querySelector("#btnRegistrar").addEventListener("click", registrar);
    document.querySelector("#btnLogin").addEventListener("click", login);
    document.querySelector("#btnLogout").addEventListener("click", logout);
    cargarPaises();
}

async function cargarPaises() {

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
};

try {
        let response = await fetch(URL_BASE + "paises.php", requestOptions);
        let body = await response.json();

        if (body.paises && body.paises.length > 0) {
            let select = document.querySelector("#selectPaises");

            select.innerHTML = '<option value="">Seleccione un país</option>';

            for (let pais of body.paises) {
                let opcion = document.createElement("option");
                opcion.value = pais.id;
                opcion.textContent = pais.name;
                select.appendChild(opcion);
            }
        } else {
            alert("No se pudieron cargar los países");
        }
    } catch (error) {
        alert("Error de conexión al cargar países");
        console.log(error);
    }

}

