const URL_BASE = "https://goalify.develotion.com/";

const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#route");
const HOME = document.querySelector("#pantalla-home");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const AGREGAREVALUACION = document.querySelector("#pantalla-agregarEvaluacion");
const NAV = document.querySelector("ion-nav");
inicio();

function inicio() {
  ROUTER.addEventListener("ionRouteDidChange", navegar);
  document.querySelector("#logout").addEventListener("click", logout);
  document.querySelector("#btnLogin").addEventListener("click", hacerLogin);
  document.querySelector("#btnRegistrar").addEventListener("click", registrar);
  armarMenu();
  cargarPaises();
}

function logout() {
  localStorage.removeItem("token");
  MENU.close();
  armarMenu();
  NAV.push("page-home");
}


function navegar(event) {
  let ruta = event.detail.to;
  ocultarPantallas();
  MENU.close();
  switch (ruta) {
    case "/":
      HOME.style.display = "block";
      break;
    case "/login":
      LOGIN.style.display = "block";
      break;
    case "/registro":
      REGISTRO.style.display = "block";
      break;
    case "/dashboard":
      DASHBOARD.style.display = "block";
      break;
  }
}

async function mostrarAlert({ header = "", subHeader = "", message = "", buttons = ["OK"] }) {
  const alert = document.querySelector("#alertaGlobal");

  if (!alert) {
    console.error("el ion-alert no se encuentra")
    return
  }

  alert.header = header;
  alert.subHeader = subHeader
  alert.message = message;
  alert.buttons = buttons;

  await alert.present();
}


function armarMenu() {
  let elemsClaseDeslogueado = document.querySelectorAll(".deslogueado");
  let elemsClaseLogueado = document.querySelectorAll(".logueado");

  for (let elem of elemsClaseDeslogueado) {
    elem.style.display = "none";
  }
  for (let elem of elemsClaseLogueado) {
    elem.style.display = "none";
  }

  let estoyLogueado = localStorage.getItem("token") != null;
  if (estoyLogueado) {
    for (let elem of elemsClaseLogueado) {
      elem.style.display = "block";
    }
  } else {
    for (let elem of elemsClaseDeslogueado) {
      elem.style.display = "block";
    }
  }
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
      let texto = "";

      for (let pais of body.paises) {
        texto += `<ion-select-option value="${pais.id}">${pais.name}</ion-select-option>`;
      }

      document.querySelector("#selectPaises").innerHTML = texto;
    } else {
      alert("No se pudieron cargar los países");
    }

  } catch (error) {
    alert("Error de conexión al cargar países");
    console.error(error);
  }
}

async function registrar() {
  let usuario = document.querySelector("#usuario").value;
  let password = document.querySelector("#password").value;
  let pais = document.querySelector("#selectPaises").value;

  if (!camposValidos(usuario, password, pais)) {
    await mostrarAlert({
      header: "Por favor completa todos los campos",
      message: "Revisar los datos."
    })
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
        await mostrarAlert({
          header: "Error",
          subHeader: "Revisar los datos",
          message: body.mensaje || 'Ocurrió un error inesperado'
        })
      } else {
        localStorage.setItem("token", body.token);
        localStorage.setItem("idUsuario", body.id);
        await mostrarAlert({
          header: "Registro exitoso",
          subHeader: "Bienvenido",
          message: "Tu cuenta fue creada correctamente"
        })

        document.querySelector('#usuario').value = '';
        document.querySelector('#password').value = '';
        login(objUsuario.usuario, objUsuario.password);
      }
    } catch (error) {
      alert("Hubo un error al registrar el usuario");
      console.log(error);
    }
  }
}

async function login(usuario, password) {
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
      // Login exitoso
      localStorage.setItem("token", body.token);
      localStorage.setItem("idUsuario", body.id);
       NAV.push("page-agregarEvaluacion");
    } else if (body.mensaje) {
      body.codigo = 400;
    } else {
      body.mensaje = "Ocurrió un error inesperado";
    }

    return body

  } catch (error) {
    /// Error al hacer login
  
    console.log(error);
  }
}


async function hacerLogin() {
  let usuario = document.querySelector("#usuarioLogin").value;
  let password = document.querySelector("#passwordLogin").value;
  if (!camposValidos(usuario, password)) {
    await mostrarAlert({
      header: "Por favor completa todos los campos",
      message: "Revisar los datos."
    })
    return;
}
  try {
    const resultado = await login(usuario, password)

    if (resultado.codigo === 200) {
      await mostrarAlert({
        header: "Login exitoso",
        message: resultado.mensaje || "Has iniciado sesion correctamente"
      });
    } else {
      await mostrarAlert({
        header: "Error de login",
        message: resultado.mensaje || "Credenciales inválidas."
      });
    }
  } catch (error) {
    console.log(error)
    await mostrarAlert({
      header: 'Error',
      message: 'Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo '
    });
  }

}

function camposValidos(...datos) {
  for (let dato of datos) {
    if (dato == null || dato == "") {
      return false;
    }
  }
  return true;
}

function ocultarPantallas() {
  HOME.style.display = "none";
  LOGIN.style.display = "none";
  REGISTRO.style.display = "none";
  AGREGAREVALUACION.style.display = "none";
}

function ocultarTodasLasSecciones() {
  document.querySelector("#pantalla-registro").style.display = "none";
  document.querySelector("#pantalla-login").style.display = "none";
  document.querySelector("#pantalla-principal").style.display = "none";
  document.querySelector("#pantalla-agregarEvaluacion").style.display = "none";
}

function mostrarSeccionRegistro() {
  ocultarTodasLasSecciones();
  document.querySelector("#pantalla-registro").style.display = "block";
}

function mostrarSeccionLogin() {
  ocultarTodasLasSecciones();
  document.querySelector("#pantalla-login").style.display = "block";
}

function mostrarAgregarEvaluacion() {
  ocultarTodasLasSecciones();
  document.querySelector("#pantalla-agregarEvaluacion").style.display = "block";
}
