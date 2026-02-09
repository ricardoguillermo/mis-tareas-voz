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

// obtenerTareas(); //solita?

// 3. Evento cuando terminas de hablar

// Al recibir voz, solo llenamos el campo para que puedas editarlo
recognition.onresult = (event) => {
  const voz = event.results[0][0].transcript;
  document.getElementById("tarea-titulo").value = voz;
};

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

function abrirEditorSeguro() {
    const clave = prompt("Introduce la clave de familiar para agregar tareas:");
    const autorizados = ["Diana_hija", "Ricardo_esposo", "Aníbal_hijo_menor", "Guillermo_hijo_mayor"];

    if (autorizados.includes(clave)) {
        document.getElementById('contenedor-editor').style.display = 'block';
        hablar("Modo edición activado.");
    } else {
        alert("Clave incorrecta. Solo la familia puede agregar tareas.");
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
  document.getElementById("lista-tareas").style.display = "none";
  document.getElementById("seccion-familia").style.display = "none";
  document.getElementById("seccion-musica").style.display = "none"; 
  document.getElementById("seccion-ayudas").style.display = "none"; 
//   lo puse yo
document.getElementById("seccion-compras").style.display = "none";
document.getElementById("cabecera-fija").style.display = "none"; // Aseguramos que el editor también se esconda

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
/* function mostrarSeccion(idSeccion) {
    // Agregamos 'seccion-familia' a la lista
    const secciones = ['menu-principal', 'seccion-tareas', 'seccion-radios', 'seccion-familia','seccion-ayudas'];
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
 */

function mostrarSeccion(idSeccion) {
    // 1. Agregamos 'seccion-compras' a la lista de secciones a ocultar
    const secciones = [
        'menu-principal', 
        'seccion-tareas', 
        'seccion-radios', 
        'seccion-familia', 
        'seccion-compras' // <--- Asegúrate de que coincida con el ID en tu HTML
    ];

    secciones.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });

    // 2. Mostramos la sección activa
    const activa = document.getElementById(idSeccion);
    if (activa) {
        activa.style.display = 'block';
    }

    // 3. Si entramos a tareas, mostramos también la lista de compras 
    // pero solo como un módulo dentro de esa sección si así lo prefieres
    if (idSeccion === 'seccion-tareas') {
        const compras = document.getElementById('seccion-compras');
        if (compras) compras.style.display = 'block';
        obtenerTareas(); 
    }
}

// Función para guardar lo que escribiste o dictaste
async function guardarTareaManual() {
    const titulo = document.getElementById("titulo-tarea").value;
    const notas = document.getElementById("notas-tarea").value;
    const fecha = document.getElementById("fecha-seleccionada").value;

    if (!titulo) return alert("Por favor, escribe o dicta una tarea.");

    try {
        const response = await fetch("https://mis-tareas-voz.onrender.com/tareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                titulo: titulo, 
                notas: notas, 
                fecha_creacion: fecha, // Guardamos con la fecha del calendario
                chequeado: false 
            }),
        });

        if (response.ok) {
            // 1. Limpiamos los campos
            document.getElementById("titulo-tarea").value = "";
            document.getElementById("notas-tarea").value = "";
            // 2. Cerramos el editor azul
            document.getElementById('contenedor-editor').style.display = 'none';
            // 3. Refrescamos la lista de hoy
            obtenerTareas();
        }
    } catch (error) {
        console.error("Error al guardar:", error);
    }
}

// Conexión del Micrófono (dentro del DOMContentLoaded)
window.addEventListener('DOMContentLoaded', () => {
mostrarSeccion('menu-principal');
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
    }

// 3. ¡IMPORTANTE! Llamamos a la función para que busque las tareas de hoy en Render
        obtenerTareas();

    const btnVoz = document.getElementById('btn-voz');
    if (btnVoz) {
        btnVoz.onclick = () => {
            recognition.start();
            console.log("Escuchando voz...");
        };
    }
    
    // Al recibir el resultado de voz, lo ponemos en el input
    recognition.onresult = (event) => {
        const voz = event.results[0][0].transcript;
        document.getElementById("titulo-tarea").value = voz;
    };
});

// 1. Cambiamos el nombre de la función para que coincida con el error
async function alternarTarea(id, estado) {
  try {
    await fetch(`${urlBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chequeado: estado }),
    });
    
    if (estado === true) {
      hablar("¡Qué bien! Terminamos esta actividad.");
    }

    obtenerTareas(); // Refrescamos la lista
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
  }
}

// 2. Asegúrate que la interfaz llame a 'alternarTarea'
/* function actualizarInterfazTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');
    if (!contenedor) return;
    contenedor.innerHTML = "";

console.log("Actualizando interfaz con tareas:", tareas);
    if (tareas.length === 0) {
        contenedor.innerHTML = '<p class="mensaje-vacio">No hay tareas para este día.</p>';
        return;
    }


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
} */

async function cargarRutinaRemedios() {
    const fecha = document.getElementById('fecha-seleccionada').value;
    const remedios = [
        "💊 Remedio Presión (Mañana)",
        "💊 Remedio Corazón (Almuerzo)",
        "💊 Gotas ojos (Noche)"
    ];

    hablar("Cargando los remedios del día.");

    for (const titulo of remedios) {
        await fetch(urlBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                titulo: titulo, 
                fecha_creacion: fecha, 
                chequeado: false 
            }),
        });
    }
    obtenerTareas(); // Refresca la lista al terminar
}

function actualizarInterfazTareas(tareas) {
    const contenedor = document.getElementById('lista-tareas');
    const contenedorCompras = document.getElementById('lista-compras'); // ¡Crea este div en tu HTML!
    console.log("Actualizando interfaz con tareas:", tareas);
    contenedor.innerHTML = "";
    if(contenedorCompras) contenedorCompras.innerHTML = "";

    tareas.forEach(tarea => {
        const esCompra = tarea.titulo.toLowerCase().startsWith("comprar") || 
                         tarea.titulo.toLowerCase().startsWith("compra");

        const div = document.createElement('div');
        div.className = esCompra ? 'tarea-card compra' : 'tarea-card';
        div.innerHTML = `
            <span>${esCompra ? '🛒' : '📌'} ${tarea.titulo}</span>
            <input type="checkbox" onchange="alternarTarea('${tarea._id}', this.checked)">
        `;

        // Si es compra, lo mandamos a la lista de compras, si no, a tareas
        if (esCompra && contenedorCompras) {
            contenedorCompras.appendChild(div);
        } else {
            contenedor.appendChild(div);
        }
    });
}

function enviarListaWhatsApp() {
    const tareas = document.querySelectorAll('#lista-compras .tarea-card span');
    let texto = "*Lista de Supermercado - " + document.getElementById('fecha-seleccionada').value + "*\n";
    
    tareas.forEach(t => {
        texto += "- " + t.innerText.replace('🛒', '').trim() + "\n";
    });

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// Función para el Acordeón
function toggleAcordeon(id) {
    const contenido = document.getElementById(id);
    const item = contenido.parentElement;
    
    // Cerramos los demás si queremos que solo haya uno abierto
    // document.querySelectorAll('.acordeon-item').forEach(i => i.classList.remove('abierto'));

    item.classList.toggle('abierto');
}

// Actualizamos la navegación
function mostrarSeccion(idSeccion) {
    const secciones = ['menu-principal', 'seccion-tareas', 'seccion-radios', 'seccion-familia', 'seccion-ayuda'];
    
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const activa = document.getElementById(idSeccion);
    if (activa) activa.style.display = 'block';
}