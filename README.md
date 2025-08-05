# Goalify

Aplicación de seguimiento de objetivos personales desarrollada en el marco del Taller de Desarrollo para Dispositivos Móviles de la carrera Analista en Tecnologías de la Información (ORT Uruguay).

## Objetivo del proyecto

Desarrollar una aplicación web móvil que permita a los usuarios registrar y evaluar sus objetivos diarios, visualizando su progreso mediante estadísticas y herramientas gráficas, consumiendo servicios de una API REST externa.

## Funcionalidades principales

* Registro de usuario con selección de país
* Login y logout
* Alta de evaluaciones con objetivo, calificación (-5 a 5) y fecha (hoy o días pasados)
* Listado de evaluaciones con ícono por objetivo y botón de eliminación
* Filtros de evaluaciones por última semana, último mes o todo el histórico
* Informe de cumplimiento con:

  * Promedio global de calificaciones
  * Promedio diario
* Mapa interactivo con 10 marcadores que muestran la cantidad de usuarios registrados por país

## Tecnologías utilizadas

* JavaScript
* Ionic Framework
* localStorage para gestión de sesión
* API REST provista por el docente

## Casos contemplados

* Validación de campos antes de enviar datos
* Manejo de errores del servidor
* Persistencia del login con localStorage
* Prevención de llamadas a la API sin token válido

## Usuarios de prueba

Para facilitar la validación de la aplicación, se han creado las siguientes cuentas de ejemplo:

| Usuario         | Contraseña |
| --------------- | ---------- |
| Camilo09        | Hola12345  |
| sofia1          | sofia1     |

## Integrantes

* Camilo Pardo – 200710
* Francisco Rodriguez – 277804
