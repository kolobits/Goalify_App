const URL_BASE = "https://goalify.develotion.com/";
const MENU = document.querySelector("#menu");
const ROUTER = document.querySelector("#route");
const HOME = document.querySelector("#pantalla-home");
const LOGIN = document.querySelector("#pantalla-login");
const REGISTRO = document.querySelector("#pantalla-registro");
const AGREGAREVALUACION = document.querySelector("#pantalla-agregarEvaluacion");
const PUNTAJE = document.querySelector("#pantalla-puntaje");
const NAV = document.querySelector("ion-nav");
inicio();

let objetivos = [];

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
  armarMenu();
  NAV.push("page-home");
}

// NAVEGAR
// Esta función se encarga de navegar entre las diferentes pantallas de la aplicación
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
    case "/agregarEvaluacion":
      cargarEvaluaciones();
      AGREGAREVALUACION.style.display = "block";
      break;
    case "/puntaje":
      cargarPuntaje();
      PUNTAJE.style.display = "block";
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
    if (body.token) {
      localStorage.setItem("token", body.token);
      localStorage.setItem("idUsuario", body.id);
      NAV.push("page-agregarEvaluacion");
      cargarObjetivos();
      cargarEvaluaciones();
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
    console.log(error);
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

    if (body.codigo === 200) {
      let selectObjetivo = document.querySelector("#selectObjetivo");
      let texto = "";

      for (let objetivo of body.objetivos) {
        texto += `<ion-select-option value="${objetivo.id}">${objetivo.emoji} ${objetivo.nombre}</ion-select-option>`;
      }
      selectObjetivo.innerHTML = texto;

      objetivos = body.objetivos;
      console.log("Objetivos cargados:", objetivos);
    } else {
      await mostrarAlert({
        header: "Error al cargar objetivos",
        message: body.mensaje,
      });
    }
  } catch (error) {
    console.log(error);
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
    console.log(body);

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
    let url = `${URL_BASE}evaluaciones.php?idUsuario=${localStorage.getItem(
      "idUsuario"
    )}`;
    let response = await fetch(url, requestOptions);
    let body = await response.json();
    console.log(body);

    if (body.codigo === 200) {
      console.log("Evaluaciones cargadas:", body.evaluaciones);

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
        } else {
          texto = `No tiene evaluaciones dispobibles`;
        }
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
      message: "No se pudieron cargar las evaluaciones.",
    });
  }
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
      message: "No se pudieron cargar las evaluaciones.",
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
    let response = await fetch(
      `${URL_BASE}evaluaciones.php?idUsuario=${idUsuario}`,
      requestOptions
    );
    let body = await response.json();

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
      let hoy = new Date();
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

  if (fechaSeleccionada < fechaHoy) {
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
}

// OCULTAR TODAS LAS SECCIONES
// Esta función se encarga de ocultar todas las secciones de la aplicación
function ocultarTodasLasSecciones() {
  document.querySelector("#pantalla-registro").style.display = "none";
  document.querySelector("#pantalla-login").style.display = "none";
  document.querySelector("#pantalla-principal").style.display = "none";
  document.querySelector("#pantalla-agregarEvaluacion").style.display = "none";
  document.querySelector("#pantalla-puntaje").style.display = "none";
}

// function mostrarSeccionRegistro() {
//   ocultarTodasLasSecciones();
//   document.querySelector("#pantalla-registro").style.display = "block";
// }

// function mostrarSeccionLogin() {
//   ocultarTodasLasSecciones();
//   document.querySelector("#pantalla-login").style.display = "block";
// }

// function mostrarAgregarEvaluacion() {
//   ocultarTodasLasSecciones();
//   document.querySelector("#pantalla-agregarEvaluacion").style.display = "block";
// }
