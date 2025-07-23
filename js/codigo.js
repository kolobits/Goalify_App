const URL_BASE = "https://goalify.develotion.com/";
let token = "";

inicio();

function inicio() {
  document.querySelector("#btnRegistrar").addEventListener("click", registrar);
  document.querySelector("#btnLogin").addEventListener("click", hacerLogin);
  // document.querySelector("#btnLogout").addEventListener("click", logout);
  cargarPaises();
}

async function cargarPaises() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
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


async function registrar() {
  let usuario = document.querySelector("#usuario").value;
  let password = document.querySelector("#password").value;
  let pais = document.querySelector("#selectPaises").value;

  if (!camposValidos(usuario, password, pais)) {
    alert("Por favor, complete todos los campos");
  } else {
    let objUsuario = new Usuario(usuario, password, pais);
    console.log(objUsuario);
    console.log(JSON.stringify(objUsuario));

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const rawBody = JSON.stringify(objUsuario);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: rawBody,
      redirect: "follow",
    };

    try {
      let response = await fetch(URL_BASE + "usuarios.php", requestOptions);
      let body = await response.json();
      console.log(body);

      if (body.codigo !== 200) {
        alert(body.mensaje);
      } else {
        localStorage.setItem("token", body.token);
        localStorage.setItem("idUsuario", body.id);
        alert("Registro exitoso");
        document.querySelector("#formRegistro").reset();
        login(objUsuario.usuario , objUsuario.password)
        

      }
    } catch (error) {
      alert("Hubo un error al registrar el usuario");
      console.log(error);
    }
  }
}

async function login(usuario , password) {

  if (!camposValidos(usuario, password)) {
    alert("Por favor, complete todos los campos");
  } else {
    let obj = {};
    obj.usuario = usuario;
    obj.password = password;

    console.log(obj);
    console.log(JSON.stringify(obj));

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const rawBody = JSON.stringify(obj);
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: rawBody,
      redirect: "follow",
    };
    try {
      let response = await fetch(URL_BASE + "login.php", requestOptions);
      let body = await response.json();
      console.log(body);

      if (body.token) {
        localStorage.setItem("token", body.token);
        localStorage.setItem("idUsuario", body.id);
        alert("Login exitoso");
        mostarDashboard();
        document.querySelector("#welcomeUser").innerHTML = `Bienvenid/a ${obj.usuario}!!`
      } else if (body.mensaje) {
        alert("Error al iniciar sesión: " + body.mensaje);
      } else {
        alert("Error desconocido al iniciar sesión.");
      }
    } catch (error) {
      alert("Error de conexión al iniciar sesión");
      console.log(error);
    }
  }

}

function hacerLogin(){
  let usuario = document.querySelector("#usuarioLogin").value;
  let password = document.querySelector("#passwordLogin").value;

   login(usuario,password);

}



function camposValidos(...datos) {
  for (let dato of datos) {
    if (dato == null || dato == "") {
      return false;
    }
  }
  return true;
}

function ocultarTodasLasSecciones() {
  document.querySelector("#pantalla-registro").style.display = "none";
  document.querySelector("#pantalla-login").style.display = "none";
  document.querySelector("#pantalla-principal").style.display = "none";
}

function mostrarSeccionRegistro() {
  ocultarTodasLasSecciones();
  document.querySelector("#pantalla-registro").style.display = "block";
}

function mostrarSeccionLogin() {
  ocultarTodasLasSecciones();
  document.querySelector("#pantalla-login").style.display = "block";
}

function mostarDashboard(){
  ocultarTodasLasSecciones();
  document.querySelector("#dashboard").style.display = "block";
}