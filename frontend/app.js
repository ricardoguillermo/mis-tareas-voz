// 1. Configuración de Voz
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new Recognition(); // <--- Aquí se define
recognition.lang = "es-ES";

const btn = document.querySelector("#btn-voz");
const MIinput = document.getElementById("tarea-texto");

// document.getElementById("fecha-seleccionada").onchange = obtenerTareas;
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


// Nota: Las funciones mostrarSeccion y volverAlMenu se llaman desde el HTML
function hablar(texto) {
  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 0.9; // Hablar un poquito más lento para mayor claridad
  window.speechSynthesis.speak(mensaje);
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


// ÚNICA FUNCIÓN PARA DIBUJAR EN PANTALLA
function actualizarInterfazTareas(tareas) {

    const contenedor = document.getElementById('lista-tareas');
    if (!contenedor) return;

    // Limpiamos lo que haya viejo
    contenedor.innerHTML = "";

    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay tareas para este día.</p>';
        return;
    }

    // Dibujamos las nuevas
    tareas.forEach(tarea => {
        const div = document.createElement('div');
        div.className = 'tarea-card';
        div.innerHTML = `
            <div class="tarea-info">
                <input type="checkbox" ${tarea.chequeado ? 'checked' : ''} 
                       onchange="alternarTarea('${tarea._id}', this.checked)">
                <span class="${tarea.chequeado ? 'completada' : ''}">${tarea.titulo}</span>
            </div>
        `;
        contenedor.appendChild(div);
    });
}


async function obtenerTareas() {
    const inputFecha = document.getElementById('fecha-seleccionada');
    if (!inputFecha) return;

    const fechaABuscar = inputFecha.value;

    try {
        const respuesta = await fetch(`https://mis-tareas-voz.onrender.com/tareas?fecha=${fechaABuscar}`);
        const tareas = await respuesta.json();
        
        // Llamamos a la función que dibuja los checks en pantalla
        actualizarInterfazTareas(tareas);
    } catch (error) {
        console.error("Error al cargar tareas del día:", error);
    }
}

// 1. EL CEREBRO DE LAS PANTALLAS
function mostrarSeccion(idSeccion) {
    // Agregamos 'seccion-familia' a la lista
    const secciones = ['menu-principal', 'seccion-tareas', 'seccion-radios', 'seccion-familia'];

    secciones.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });

    const activa = document.getElementById(idSeccion);
    if (activa) {
        activa.style.display = 'block';
    }
}

// Este bloque hace que la app "despierte" con la fecha de hoy y sus tareas
window.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('fecha-seleccionada');
    
    if (selector) {
        // 1. Obtenemos la fecha de hoy en formato AAAA-MM-DD (Formato que entiende el input type="date")
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${anio}-${mes}-${dia}`;
        
        // 2. Seteamos el calendario visualmente
        selector.value = fechaHoy;
        console.log("Sistema iniciado en la fecha: " + fechaHoy);

        // 3. ¡IMPORTANTE! Llamamos a la función para que busque las tareas de hoy en Render
        obtenerTareas();
    }
});