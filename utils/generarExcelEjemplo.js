// ============================================================
// utils/generarExcelEjemplo.js
// Ejecutar con: node utils/generarExcelEjemplo.js
// Genera un archivo productos.xlsx de ejemplo en /public/productos/
// ============================================================
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DESTINO = path.join(__dirname, '../../public/productos/productos.xlsx');

// Datos ficticios de ejemplo para RINO USAS
const productos = [
  {
    'Nombre del Alambre': 'Alambre Galvanizado N°12',
    'Descripcion': 'Alambre galvanizado de uso general para alambrado rural y perimetral. Alta resistencia a la corrosión.',
    'Diametro mm': '2,77 (+/-0,085)',
    'Carga de Rotura Kg': '150 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Clase A - 260 g/m²',
    'Peso por Rollo Aprox. Kg': '25',
    'Largo Aprox. m': '200'
  },
  {
    'Nombre del Alambre': 'Alambre Galvanizado N°14',
    'Descripcion': 'Ideal para cercas de potreros y jardines. Flexibilidad mejorada para instalación rápida.',
    'Diametro mm': '2,11 (+/-0,085)',
    'Carga de Rotura Kg': '95 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Clase A - 240 g/m²',
    'Peso por Rollo Aprox. Kg': '18',
    'Largo Aprox. m': '280'
  },
  {
    'Nombre del Alambre': 'Alambre Galvanizado N°16',
    'Descripcion': 'Alambre liviano para atar y amarre en construcción y agricultura.',
    'Diametro mm': '1,65 (+/-0,085)',
    'Carga de Rotura Kg': '58 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Clase B - 200 g/m²',
    'Peso por Rollo Aprox. Kg': '10',
    'Largo Aprox. m': '350'
  },
  {
    'Nombre del Alambre': 'Alambre Liso Trefilado N°12',
    'Descripcion': 'Alambre de acero trefilado sin recubrimiento. Uso en construcción civil y refuerzo estructural.',
    'Diametro mm': '2,77 (+/-0,085)',
    'Carga de Rotura Kg': '165 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Sin recubrimiento',
    'Peso por Rollo Aprox. Kg': '25',
    'Largo Aprox. m': '195'
  },
  {
    'Nombre del Alambre': 'Alambre de Alta Resistencia N°10',
    'Descripcion': 'Alambre de alta resistencia mecánica para alambrados en zonas de alta tensión y terrenos difíciles.',
    'Diametro mm': '3,55 (+/-0,085)',
    'Carga de Rotura Kg': '280 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Clase A - 280 g/m²',
    'Peso por Rollo Aprox. Kg': '35',
    'Largo Aprox. m': '140'
  },
  {
    'Nombre del Alambre': 'Alambre Galvanizado N°18',
    'Descripcion': 'Alambre muy liviano y flexible para uso doméstico, manualidades y celosías de jardín.',
    'Diametro mm': '1,22 (+/-0,085)',
    'Carga de Rotura Kg': '30 (+/-5,5)',
    'Recubrimiento Galvanizado': 'Clase B - 180 g/m²',
    'Peso por Rollo Aprox. Kg': '5',
    'Largo Aprox. m': '450'
  }
];

// Crear el directorio si no existe
const dir = path.dirname(DESTINO);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Crear el workbook y la hoja
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(productos);

// Ajustar ancho de columnas
ws['!cols'] = [
  { wch: 30 }, // Nombre
  { wch: 60 }, // Descripcion
  { wch: 22 }, // Diametro
  { wch: 22 }, // Carga Rotura
  { wch: 25 }, // Recubrimiento
  { wch: 22 }, // Peso
  { wch: 18 }  // Largo
];

XLSX.utils.book_append_sheet(wb, ws, 'Productos');
XLSX.writeFile(wb, DESTINO);

console.log(`✅ Excel de ejemplo generado en: ${DESTINO}`);
