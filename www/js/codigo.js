const URL_BASE = "https://goalify.develotion.com/";
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#route");
const HOME = document.querySelector("#pantalla-home");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const AGREGAREVALUACION = document.querySelector("#pantalla-agregarEvaluacion");
const PUNTAJE = document.querySelector("#pantalla-puntaje");
const MAPA = document.querySelector("#pantalla-mapa");
const NAV = document.querySelector("ion-nav");
inicio();

let objetivos = [];
let paises = [];
let usuariosXPais = [];

// INICIO
// Esta función se encarga de inicializar la aplicación
function inicio() {
  ROUTER.addEventListener("ionRouteDidChange", navegar);
  document.querySelector("#logout").addEventListener("click", logout);
  document.querySelector("#btnLogin").addEventListener("click", hacerLogin);
  document.querySelector("#btnRegistrar").addEventListener("click", registrar);
  document.querySelector("#btnGuardarEvaluacion").addEventListener("click", guardarEvaluacion);
  document.querySelector("#btnFiltrarFechas").addEventListener("click", filtrarEvaluaciones);
  cargarPaises();
  armarMenu();

  if (localStorage.getItem("token") && localStorage.getItem("idUsuario")) {
    cargarObjetivos();
  }
}

// LOGOUT
// Esta función se encarga de cerrar la sesión del usuario
function logout() {
  localStorage.removeItem("token");
  MENU.close();
  document.querySelector("#bienvenida").innerHTML = "Pantalla de inicio";
  armarMenu();
  NAV.push("page-home");
}

// NAVEGAR
// Esta función se encarga de navegar entre las diferentes pantallas de la aplicación
async function navegar(event) {
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
    case "/agregarEvaluacion":
      PrenderLoading("Cargando...");
      cargarObjetivos();
      cargarEvaluaciones();
      AGREGAREVALUACION.style.display = "block";
      ApagarLoading();
      break;
    case "/puntaje":
      PrenderLoading("Cargando...");
      PUNTAJE.style.display = "block";
      cargarPuntaje();
      ApagarLoading();
      break;
    case "/mapa":
      MAPA.style.display = "block";
      PrenderLoading("Cargando mapa...");
      await usuariosPorPais();
      setTimeout(function () {
        mostrarMapa();
      }, 100);
      ApagarLoading();
      break;
  }
}

// MOSTRAR ALERTA
// Esta función se encarga de mostrar una alerta global con un mensaje, encabezado y botones
async function mostrarAlert({
  header = "",
  subHeader = "",
  message = "",
  buttons = ["OK"],
}) {
  const alert = document.querySelector("#alertaGlobal");

  if (!alert) {
    console.error("el ion-alert no se encuentra");
    return;
  }

  alert.header = header;
  alert.subHeader = subHeader;
  alert.message = message;
  alert.buttons = buttons;

  await alert.present();
}

// MENU
// Esta función se encarga de armar el menú dependiendo del estado de login del usuario
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

// CARGAR PAÍSES
// Esta función se encarga de cargar los países desde el servidor y mostrarlos en el select
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
    if (await manejarError401(body)) return;

    if (body.paises && body.paises.length > 0) {
      let texto = "";

      for (let pais of body.paises) {
        texto += `<ion-select-option value="${pais.id}">${pais.name}</ion-select-option>`;
      }

      document.querySelector("#selectPaises").innerHTML = texto;

      paises = body.paises

    } else {
      await mostrarAlert({
        header: "Error al cargar países",
        message: "No se pudieron cargar los países disponibles.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo conectar con el servidor al intentar cargar los países.",
    });
  }
}

// REGISTRO
// Esta función se encarga de registrar un nuevo usuario
// Recibe el usuario, la contraseña y el país, y envía los datos al servidor
async function registrar() {
  let usuario = document.querySelector("#usuario").value;
  let password = document.querySelector("#password").value;
  let pais = document.querySelector("#selectPaises").value;

  if (!camposValidos(usuario, password, pais)) {
    await mostrarAlert({
      header: "Por favor completa todos los campos",
      message: "Revisar los datos.",
    });
  } else {
    let objUsuario = new Usuario(usuario, password, pais);
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
      if (await manejarError401(body)) return;

      if (body.codigo !== 200) {
        await mostrarAlert({
          header: "Error",
          subHeader: "Revisar los datos",
          message: body.mensaje || "Ocurrió un error inesperado",
        });
      } else {
        localStorage.setItem("token", body.token);
        localStorage.setItem("idUsuario", body.id);
        await mostrarAlert({
          header: "Registro exitoso",
          subHeader: "Bienvenido",
          message: "Tu cuenta fue creada correctamente",
        });

        document.querySelector("#usuario").value = "";
        document.querySelector("#password").value = "";
        login(objUsuario.usuario, objUsuario.password);
      }
    } catch (error) {
      await mostrarAlert({
        header: "Error de conexión",
        message:
          "No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.",
      });
    }
  }
}

// LOGIN
// Esta función se encarga de hacer el login del usuario
// Recibe el usuario y la contraseña, y devuelve un objeto con el token y el id
async function login(usuario, password) {
  let obj = {};
  obj.usuario = usuario;
  obj.password = password;

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
    if (await manejarError401(body)) return;
    if (body.token) {
      localStorage.setItem("token", body.token);
      localStorage.setItem("idUsuario", body.id);
      document.querySelector("#bienvenida").innerHTML = `Bienvenido ${usuario}`;
      NAV.push("page-home");
      armarMenu();
    } else if (body.mensaje) {
      body.codigo = 400;
    } else {
      body.mensaje = "Ocurrió un error inesperado";
    }
    return body;
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message:
        "No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.",
    });
  }
}

// Hacer login desde el botón de login
// Esta función se encarga de validar los campos y llamar a la función de login
async function hacerLogin() {
  let usuario = document.querySelector("#usuarioLogin").value;
  let password = document.querySelector("#passwordLogin").value;
  if (!camposValidos(usuario, password)) {
    await mostrarAlert({
      header: "Por favor completa todos los campos",
      message: "Revisar los datos.",
    });
    return;
  }
  try {
    const resultado = await login(usuario, password);

    if (resultado.codigo === 200) {
      await mostrarAlert({
        header: "Login exitoso",
        message: resultado.mensaje || "Has iniciado sesion correctamente",
      });
    } else {
      await mostrarAlert({
        header: "Error de login",
        message: resultado.mensaje || "Credenciales inválidas.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error",
      message:
        "Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo ",
    });
  }
}

// CARGAR OBJETIVOS
// Esta función se encarga de cargar los objetivos desde el servidor y mostrarlos en el select
async function cargarObjetivos() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    let response = await fetch(URL_BASE + "objetivos.php", requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      let selectObjetivo = document.querySelector("#selectObjetivo");
      let texto = "";

      for (let objetivo of body.objetivos) {
        texto += `<ion-select-option value="${objetivo.id}">${objetivo.emoji} ${objetivo.nombre}</ion-select-option>`;
      }
      selectObjetivo.innerHTML = texto;

      objetivos = body.objetivos;
    } else {
      await mostrarAlert({
        header: "Error al cargar objetivos",
        message: body.mensaje,
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error",
      message: "No se pudieron cargar los objetivos",
    });
  }
}

// GUARDAR EVALUACIÓN
// Esta función se encarga de guardar una evaluación en el servidor
async function guardarEvaluacion() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");
  let idObjetivo = document.querySelector("#selectObjetivo").value;
  let calificacion = document.querySelector("#calificacion").value;
  let fecha = document.querySelector("#fecha").value;

  if (!camposValidos(idUsuario, idObjetivo, calificacion, fecha)) {
    await mostrarAlert({
      header: "Por favor completa todos los campos",
      message: "Revisar los datos.",
    });
    return;
  }
  if (calificacion < -5 || calificacion > 5) {
    await mostrarAlert({
      header: "Calificación inválida",
      message: "La calificación debe estar entre -5 y 5.",
    });
    return;
  }
  if (!fechaValida(fecha)) {
    await mostrarAlert({
      header: "Fecha inválida",
      message: "La fecha debe ser anterior o igual a la fecha actual.",
    });
    return;
  }

  let objEvaluacion = {
    idUsuario: idUsuario,
    idObjetivo: idObjetivo,
    calificacion: calificacion,
    fecha: fecha,
  };

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const rawBody = JSON.stringify(objEvaluacion);
  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: rawBody,
    redirect: "follow",
  };
  try {
    let response = await fetch(URL_BASE + "evaluaciones.php", requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      await mostrarAlert({
        header: "Evaluación guardada",
        message: "Tu evaluación se ha guardado correctamente.",
      });
      document.querySelector("#selectObjetivo").value = "";
      document.querySelector("#calificacion").value = "";
      document.querySelector("#fecha").value = "";
      cargarEvaluaciones();
    } else {
      await mostrarAlert({
        header: "Error al guardar la evaluación",
        message: body.mensaje || "Ocurrió un error inesperado.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message:
        "No se pudo guardar la evaluación. Por favor, inténtalo de nuevo.",
    });
  }
}

// CARGAR EVALUACIONES
// Esta función se encarga de cargar las evaluaciones del usuario desde el servidor y mostrarlas
async function cargarEvaluaciones() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    headers: myHeaders,
    redirect: "follow",
  };
  try {
    // PrenderLoading("Cargando evaluaciones...");
    let url = `${URL_BASE}evaluaciones.php?idUsuario=${idUsuario}`;
    let response = await fetch(url, requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      let texto = "";
      for (let evaluacion of body.evaluaciones) {
        const objetivo = objetivos.find(
          (obj) => obj.id === evaluacion.idObjetivo
        );

        if (objetivo) {
          texto += `
        <ion-item>
          <ion-label>
            Objetivo: ${objetivo.emoji} ${objetivo.nombre}
            Calificación: ${evaluacion.calificacion} | Fecha: ${evaluacion.fecha}
          </ion-label>
          <ion-button onclick="eliminarEvaluacion(${evaluacion.id})" fill="clear">Borrar</ion-button>
        </ion-item>
      `;
        }
      }

      if (texto === "") {
        texto = `<ion-item><ion-label>No hay evaluaciones para mostrar.</ion-label></ion-item>`;
      }

      document.querySelector("#listaEvaluaciones").innerHTML = texto;
    } else {
      await mostrarAlert({
        header: "Error al cargar evaluaciones",
        message: body.mensaje || "Ocurrió un error inesperado.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo contactar con el servidor.",
    });
  }
  // ApagarLoading();
}

// ELIMINAR EVALUACIÓN
// Esta función se encarga de eliminar una evaluación del servidor
async function eliminarEvaluacion(id) {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    method: "DELETE",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    let url = `${URL_BASE}evaluaciones.php?idEvaluacion=${id}`;
    let response = await fetch(url, requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      await mostrarAlert({
        header: "Evaluacion Eliminada",
        message: body.mensaje || "Evaluacion Eliminada con exito.",
      });
      cargarEvaluaciones();
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo contactar con el servidor.",
    });
  }
}

// FILTRAR EVALUACIONES
// Esta función se encarga de filtrar las evaluaciones por fecha
async function filtrarEvaluaciones() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    let url = `${URL_BASE}evaluaciones.php?idUsuario=${idUsuario}`;
    let response = await fetch(url, requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      const filtro = document.querySelector("#filtroFechas").value;
      const hoy = new Date();

      let evaluacionesFiltradas = [];
      for (const evaluacion of body.evaluaciones) {
        const fechaEvaluacion = new Date(evaluacion.fecha);
        if (filtro === "semana") {
          let semanal = new Date(hoy);
          semanal.setDate(hoy.getDate() - 7);
          if (fechaEvaluacion >= semanal && fechaEvaluacion <= hoy) {
            evaluacionesFiltradas.push(evaluacion);
          }
        } else if (filtro === "mes") {
          let mensual = new Date(hoy);
          mensual.setDate(hoy.getDate() - 30);
          if (fechaEvaluacion >= mensual && fechaEvaluacion <= hoy) {
            evaluacionesFiltradas.push(evaluacion);
          }
        } else {
          evaluacionesFiltradas.push(evaluacion); // "todo"
        }
      }

      let texto = "";

      for (const evaluacion of evaluacionesFiltradas) {
        let objetivo = null;
        for (const obj of objetivos) {
          if (obj.id === evaluacion.idObjetivo) {
            objetivo = obj;
            break;
          }
        }
        if (objetivo) {
          texto += `<ion-item>
              <ion-label>
                Objetivo: ${objetivo.emoji} ${objetivo.nombre}
                Calificación: ${evaluacion.calificacion} | Fecha: ${evaluacion.fecha}
              </ion-label>
              <ion-button onclick="eliminarEvaluacion(${evaluacion.id})" fill="clear">Borrar</ion-button>
            </ion-item>`;
        }
      }

      if (texto === "") {
        texto = `<ion-item><ion-label>No hay evaluaciones en el período seleccionado.</ion-label></ion-item>`;
      }

      document.querySelector("#listaEvaluaciones").innerHTML = texto;
    } else {
      await mostrarAlert({
        header: "Error al filtrar",
        message: body.mensaje || "No se pudieron obtener las evaluaciones.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo contactar con el servidor.",
    });
  }
}


// CARGAR PUNTAJE GLOBAL
// Esta función se encarga de cargar el puntaje promedio del usuario desde el servidor
async function cargarPuntaje() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    // PrenderLoading("Cargando puntaje...")
    let response = await fetch(
      `${URL_BASE}evaluaciones.php?idUsuario=${idUsuario}`,
      requestOptions
    );
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      let evaluaciones = body.evaluaciones;

      let sumaCalificaciones = 0;
      let cantidadEvaluaciones = evaluaciones.length;

      for (const evaluacion of evaluaciones) {
        sumaCalificaciones += evaluacion.calificacion;
      }

      let puntajePromedio = 0;
      if (cantidadEvaluaciones > 0) {
        puntajePromedio = sumaCalificaciones / cantidadEvaluaciones;
      }

      document.querySelector("#puntajeGlobal").innerHTML = `Puntaje promedio: ${puntajePromedio.toFixed(2)}`;

      // CARGAR PUNTAJE DIARIO
      // Esta función se encarga de cargar el puntaje diario del usuario desde el servidor
      let hoy = new Date().toLocaleDateString("en-CA")
      let sumaHoy = 0;
      let cantidadHoy = 0;

      for (let evaluacion of evaluaciones) {
        if (evaluacion.fecha === hoy) {
          sumaHoy += evaluacion.calificacion;
          cantidadHoy++;
        }
      }
      let promedioHoy = 0;
      if (cantidadHoy > 0) {
        promedioHoy = (sumaHoy / cantidadHoy);
      }
      document.querySelector("#puntajeDiario").innerHTML = `Puntaje diario: ${promedioHoy.toFixed(2)}`;
    } else {
      await mostrarAlert({
        header: "Error al cargar puntaje",
        message: body.mensaje || "No se pudieron obtener las evaluaciones.",
      });
    }
  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo contactar con el servidor.",
    });
  }
  // ApagarLoading()
}

// CARGAR USUARIOS POR PAÍS
// Esta función se encarga de cargar los usuarios por país desde el servidor
async function usuariosPorPais() {
  let token = localStorage.getItem("token");
  let idUsuario = localStorage.getItem("idUsuario");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);
  myHeaders.append("iduser", idUsuario);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    let response = await fetch(URL_BASE + "usuariosPorPais.php", requestOptions);
    let body = await response.json();
    if (await manejarError401(body)) return;

    if (body.codigo === 200) {
      usuariosXPais = body.paises
    } else {
      await mostrarAlert({
        header: "Error al cargar usuarios por país",
        message: body.mensaje || "No se pudieron obtener los usuarios por país.",
      });
    }

  } catch (error) {
    await mostrarAlert({
      header: "Error de conexión",
      message: "No se pudo contactar con el servidor.",
    });
  }
}


// MAPA
// Esta función se encarga de mostrar un mapa utilizando Leaflet
let map = null;

async function mostrarMapa() {

  let latitud = -40.0
  let longitud = -60.0
  if (map != null) {
    map.remove()
  }
  map = L.map('map').setView([latitud, longitud], 3);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  let datos = usuariosXPais.map(usuarioPais => {
    let pais = paises.find(p => p.name === usuarioPais.nombre);
    if (pais) {
      return {
        nombre: usuarioPais.nombre,
        cantidad: usuarioPais.cantidadDeUsuarios,
        lat: pais.latitude,
        lng: pais.longitude
      };
    }
    return null;
  }).filter(Boolean);

  // Agregar los marcadores con tooltip
  datos.forEach(pais => {
    L.marker([pais.lat, pais.lng])
      .addTo(map)
      .bindTooltip(`${pais.nombre}: ${pais.cantidad} usuarios`, {
        direction: 'top'
      });
  });

}

// VALIDACIONES
// Esta función se encarga de validar que los campos no estén vacíos
function camposValidos(...datos) {
  for (let dato of datos) {
    if (dato == null || dato == "") {
      return false;
    }
  }
  return true;
}

// Esta función se encarga de validar que la fecha sea anterior o igual a la fecha actual
// y que no sea anterior a hoy
function fechaValida(fecha) {
  let fechaSeleccionada = new Date(fecha);
  let fechaHoy = new Date();

  if (fechaSeleccionada <= fechaHoy) {
    return true;
  }
  return false;
}


// Esta función se encarga de mostrar un loading mientras se cargan los datos
let loading = document.createElement('ion-loading');

function PrenderLoading(texto) {

  document.body.appendChild(loading);
  loading.cssClass = 'my-custom-class';
  loading.message = texto;
  loading.present();
}

function ApagarLoading() {
  loading.dismiss();

}

// Esta función se encarga de manejar el error 401 (sesión expirada)
async function manejarError401(body) {
  if (body.codigo === 401) {
    await mostrarAlert({
      header: "Sesión expirada",
      message: "Por seguridad, volvé a iniciar sesión.",
    });
    logout();
    return true;
  }
  return false;
}


// OCULTAR PANTALLAS
// Esta función se encarga de ocultar todas las pantallas de la aplicación
function ocultarPantallas() {
  HOME.style.display = "none";
  LOGIN.style.display = "none";
  REGISTRO.style.display = "none";
  AGREGAREVALUACION.style.display = "none";
  PUNTAJE.style.display = "none";
  MAPA.style.display = "none";
}

// OCULTAR TODAS LAS SECCIONES
// Esta función se encarga de ocultar todas las secciones de la aplicación
function ocultarTodasLasSecciones() {
  document.querySelector("#pantalla-registro").style.display = "none";
  document.querySelector("#pantalla-login").style.display = "none";
  document.querySelector("#pantalla-principal").style.display = "none";
  document.querySelector("#pantalla-agregarEvaluacion").style.display = "none";
  document.querySelector("#pantalla-puntaje").style.display = "none";
  document.querySelector("#pantalla-mapa").style.display = "none";
}

