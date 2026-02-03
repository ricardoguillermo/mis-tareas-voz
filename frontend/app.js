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
/* 
async function obtenerTareas() {
    // 1. Tomamos la fecha directamente del input del calendario
    const fechaInput = document.getElementById('fecha-seleccionada').value;
    
    if (!fechaInput) return; // Si no hay fecha, no buscamos nada

    try {
        // 2. Enviamos la fecha como parámetro '?fecha='
        const respuesta = await fetch(`https://mis-tareas-voz.onrender.com/tareas?fecha=${fechaInput}`);
        const tareas = await respuesta.json();
        
        // 3. Tu lógica para mostrar las tareas (ejemplo: mostrarTareas(tareas))
        mostrarTareas(tareas); 
        console.log("Tareas cargadas para:", fechaInput);
    } catch (error) {
        console.error("Error al obtener tareas:", error);
    }
} */

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

/* function mostrarSeccion(seccion) {
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
} */

// Nota: Las funciones mostrarSeccion y volverAlMenu se llaman desde el HTML
function hablar(texto) {
  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 0.9; // Hablar un poquito más lento para mayor claridad
  window.speechSynthesis.speak(mensaje);
}

 /* // Actualizamos las funciones de navegación repetida¡
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
} */
 
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
// 1. FUNCIÓN PARA OBTENER TAREAS
/* async function obtenerTareas() {
    const inputFecha = document.getElementById('fecha-seleccionada');
    const listaTareas = document.getElementById('lista-tareas');
    
    // Si el input no existe en el HTML, avisamos y no seguimos
    if (!inputFecha) {
        console.error("Error: No se encontró el elemento 'fecha-seleccionada' en el HTML.");
        return;
    }

    const fechaABuscar = inputFecha.value;
    console.log("Buscando tareas para la fecha:", fechaABuscar);

    try {
        const respuesta = await fetch(`https://mis-tareas-voz.onrender.com/tareas?fecha=${fechaABuscar}`);
        const tareas = await respuesta.json();
        console.log("pase por aqui");
       
      // LIMPIAMOS LA LISTA ANTES DE MOSTRAR LAS NUEVAS
        listaTareas.innerHTML = ""; 

        if (tareas.length === 0) {
            listaTareas.innerHTML = "<p>No hay tareas para este día.</p>";
            return;
        }
      
        // DIBUJAMOS CADA TAREA
        tareas.forEach(tarea => {
            const div = document.createElement('div');
            div.className = 'tarea-item';
            div.innerHTML = `
                <input type="checkbox" ${tarea.chequeado ? 'checked' : ''} onchange="actualizarTarea('${tarea._id}', this.checked)">
                <span>${tarea.titulo}</span>
            `;
            listaTareas.appendChild(div);
        });

    } catch (error) {
        console.error("Error en la conexión con Render:", error);
    }
} */

/* // 2. ACTIVADOR AL CARGAR LA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fecha-seleccionada');
    
    if (inputFecha) {
        // Obtenemos la fecha de hoy correctamente (formato AAAA-MM-DD)
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${anio}-${mes}-${dia}`;
        
        // Seteamos el calendario
        inputFecha.value = fechaHoy;
        
          document.getElementById("seccion-editor").style.display = "none";


        // Cargamos las tareas de hoy
        obtenerTareas();
    }
}); */
 
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
    const fecha = document.getElementById('fecha-seleccionada').value;
    try {
        const res = await fetch(`https://mis-tareas-voz.onrender.com/tareas?fecha=${fecha}`);
        const datos = await res.json();
        
        // LLAMADA ÚNICA
        actualizarInterfazTareas(datos); 
        
    } catch (error) {
        console.error("Error al traer datos:", error);
    }
}

// 1. EL CEREBRO DE LAS PANTALLAS
function mostrarSeccion(idSeccion) {
    // 1. Lista de secciones principales
    const secciones = ['menu-principal', 'seccion-tareas', 'seccion-radios'];

    secciones.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none'; // Ocultamos todo
        }
    });

    // 2. Mostramos la elegida
    const activa = document.getElementById(idSeccion);
    if (activa) {
        activa.style.display = 'block';
    }

    // 3. Limpieza extra: siempre cerramos el editor de tareas al cambiar
    const editor = document.getElementById('contenedor-editor');
    if (editor) {
        editor.style.display = 'none';
    }
}

// 2. INICIO INTELIGENTE
window.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('fecha-seleccionada');
    if (selector) {
        const hoy = new Date().toISOString().split('T')[0];
        selector.value = hoy; // Primero la fecha...
        obtenerTareas();      // ...y luego la carga
    }
});