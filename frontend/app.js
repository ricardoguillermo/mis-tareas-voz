// 1. Configuración de Voz
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new Recognition(); // <--- Aquí se define
recognition.lang = "es-ES";

const btn = document.querySelector("#btn-voz");
const MIinput = document.getElementById("tarea-texto");

document.getElementById("filtro-fecha").onchange = obtenerTareas;
// 2. Función para GUARDAR en MongoDB
// Antes: fetch('http://localhost:3000/tareas')
// Ahora:
// const urlBase = 'http://192.168.1.4:3000/tareas';
//https://maximus-inert-edgily.ngrok-free.dev
// Pega aquí la dirección que acabas de copiar de la terminal del puerto 3000
// const urlBase = 'https://maximus-inert-edgily.ngrok-free.app/tareas';
const urlBase = "https://mis-tareas-voz.onrender.com/tareas";

async function guardarTareaEnNube(texto) {
  try {
    const response = await fetch(urlBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: texto,
        notas: "Ingresado por voz",
        chequeado: false,
      }),
    });

    const data = await response.json();
    console.log("Servidor dice:", data.mensaje);

    // Refrescamos la lista para ver la nueva tarea
    obtenerTareas();
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
  }
}

obtenerTareas();

// 3. Evento cuando terminas de hablar

// Al recibir voz, solo llenamos el campo para que puedas editarlo
recognition.onresult = (event) => {
  const voz = event.results[0][0].transcript;
  document.getElementById("tarea-titulo").value = voz;
};

// Función para guardar lo que esté en los campos (Voz editada o Texto manual)
document.getElementById("btn-guardar").onclick = async () => {
  const titulo = document.getElementById("tarea-titulo").value;
  const notas = document.getElementById("tarea-notas").value;

  if (!titulo) return alert("El título es obligatorio");

  try {
    const response = await fetch(urlBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, notas, chequeado: false }),
    });

    if (response.ok) {
      // Limpiamos los campos y refrescamos la lista
      document.getElementById("tarea-titulo").value = "";
      document.getElementById("tarea-notas").value = "";
      obtenerTareas();
    }
  } catch (error) {
    console.error("Error al guardar:", error);
  }
};
3;
// 4. Iniciar el micrófono
btn.onclick = () => {
  recognition.start();
  console.log("Escuchando...");
};

async function obtenerTareas(fecha) {
  // Si no pasamos fecha, intentamos sacarla del input
    const fechaSeleccionada = fecha || document.getElementById('filtro-fecha').value;
  try {
    // const fechaSeleccionada = document.getElementById("filtro-fecha").value;
    // Enviamos la fecha como parámetro al backend
    const res = await fetch(`${urlBase}?fecha=${fechaSeleccionada}`);
    const tareas = await res.json();
   
    /* const res = await fetch(urlBase);
    const tareas = await res.json(); */
    const lista = document.getElementById("lista-tareas");
    lista.innerHTML = "";

    tareas.forEach((tarea) => {
      const item = document.createElement("li");

      item.className = `tarea-item ${tarea.chequeado ? "completada" : ""}`;

      item.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%;">
            <input type="checkbox" 
                   ${tarea.chequeado ? "checked" : ""} 
                   onchange="actualizarEstado('${tarea._id}', this.checked)"
                   style="width: 25px; height: 25px; cursor: pointer;">
            
            <div style="flex-grow: 1; margin-left: 15px;">
                <span style="${tarea.chequeado ? "text-decoration: line-through; color: #95a5a6;" : "font-weight: 500;"}">
                    ${tarea.titulo}
                </span>
                <small class="nota-texto" style="display: block;">
                    ${tarea.notas || "Sin comentarios"}
                </small>
            </div>
        </div>
    `;
      lista.appendChild(item);
    });
  } catch (error) {
    console.error("Error al cargar tareas:", error);
  }
}

async function actualizarEstado(id, estado) {
  try {
    await fetch(`${urlBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chequeado: estado }),
    });
    if (estado === true) {
      const mensaje = new SpeechSynthesisUtterance(
        "¡Qué bien! Terminamos esta actividad.",
      );
      mensaje.lang = "es-ES";
      window.speechSynthesis.speak(mensaje);
    }

    // Refrescamos la lista para que el estilo (tachado/color) se actualice
    obtenerTareas();
  } catch (error) {
    console.error("Error al actualizar:", error);
  }
}

function mostrarSeccion(seccion) {
  // 1. Ocultar todo primero
  document.getElementById("panel-tablet").style.display = "none";
  document.getElementById("contenedor-lista").style.display = "none";
  document.getElementById("seccion-musica").style.display = "none";
  // Ocultamos también la sección de ingreso de tareas para que no distraiga
  document.querySelector(".input-section").style.display = "none";

  // 2. Mostrar solo lo que elegimos
  if (seccion === "tareas") {
    document.getElementById("contenedor-lista").style.display = "block";
    // Opcional: mostrar el dictado solo si tú vas a ingresar la tarea
    document.querySelector(".input-section").style.display = "block";
  }
}

// Nota: Las funciones mostrarSeccion y volverAlMenu se llaman desde el HTML
function hablar(texto) {
  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 0.9; // Hablar un poquito más lento para mayor claridad
  window.speechSynthesis.speak(mensaje);
}

// Actualizamos las funciones de navegación
function mostrarSeccion(seccion) {
  // 1. Escondemos absolutamente todo primero
  document.getElementById("panel-tablet").style.display = "none";
  document.getElementById("contenedor-lista").style.display = "none";
  document.getElementById("seccion-familia").style.display = "none";

  // Si ya creaste el div de música, asegúrate de que el ID coincida
  const seccionMusica = document.getElementById("seccion-musica");
  if (seccionMusica) {
    seccionMusica.style.display = "none";
  }

  // 2. Mostramos solo la que corresponde
  if (seccion === "tareas") {
    document.getElementById("contenedor-lista").style.display = "block";
  } else if (seccion === "familia") {
    document.getElementById("seccion-familia").style.display = "block";
  } else if (seccion === "musica") {
    // Esta es la parte que faltaba o estaba fallando
    document.getElementById("seccion-musica").style.display = "block";
  }
}

function pedirClave() {
  const clave = prompt("Introduce la clave de familiar para editar:");

  // Usamos la clave que sugeriste
  if (clave === "Diana_hija" || clave === "Ricardo_esposo"|| clave === "Aníbal_hijo_menor"|| clave === "Guillermo_hijo_mayor") {
    document.getElementById("seccion-editor").style.display = "block";
    alert("Modo edición activado. Ahora puedes agregar tareas.");
  } else {
    alert("Clave incorrecta. Solo familiares autorizados.");
  }
}

// Modificamos volverAlMenu para que siempre vuelva a esconder el editor
function volverAlMenu() {
  // 1. Escondemos todas las secciones de contenido
  document.getElementById("contenedor-lista").style.display = "none";
  document.getElementById("seccion-familia").style.display = "none";
  document.getElementById("seccion-musica").style.display = "none"; // Preparamos la nueva

  // 2. IMPORTANTE: Cerramos el panel de edición por si quedó abierto
  document.getElementById("seccion-editor").style.display = "none";

  // 3. Mostramos el menú principal de iconos grandes
  document.getElementById("panel-tablet").style.display = "grid";
}

function reproducirAudio(nombreFamiliar) {
  const audio = new Audio(`audios/${nombreFamiliar}.mp3`);

  // Bajamos un poco el volumen de la música de fondo si la hubiera
  audio.play().catch((error) => {
    console.error("Error al reproducir el audio:", error);
    alert("Asegúrate de que el archivo existe en la carpeta /audios");
  });
}

let reproductor = document.getElementById("reproductor-radio");

function abrirRadio(url) {
    // Hablamos primero para que ella sepa qué está pasando
    hablar("Abriendo la radio en una pantalla nueva. Para volver aquí, solo tienes que cerrar la ventana.");
    
    // Abrimos la URL
    setTimeout(() => {
        window.open(url, '_blank');
    }, 1500); // Damos un segundo para que termine de hablar antes de cambiar
}

function detenerMusica() {
  const repro = document.getElementById("reproductor-radio");
  repro.pause();
  repro.src = "";
  hablar("Música apagada");
}

// Esta función se ejecuta apenas carga la página en la tablet
/* window.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fecha-seleccionada'); 
    
    // 1. Obtenemos la fecha de hoy en el huso horario local (Uruguay)
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTimeOffset() - (offset * 60 * 1000));
    const fechaFormateada = hoy.toISOString().split('T')[0];
    
    // 2. Seteamos el valor visual del calendario
    if (inputFecha) {
        inputFecha.value = fechaFormateada;
        console.log("Fecha del día establecida: " + fechaFormateada);
    }
    
    // 3. Llamamos a tu función para que cargue las tareas de hoy de inmediato
    obtenerTareas(fechaFormateada);
});
 */
