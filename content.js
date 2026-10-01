function createPaquete(input = {}) {
  return {
    id: input.id || "",
    name: input.name || "Nuevo paquete",
    kicker: input.kicker ?? "Paquete",
    lead: input.lead || "",
    price: input.price || "",
    compare: input.compare || "",
    cta: input.cta || "Comprar ahora",
    ctaHref: input.ctaHref || "#contact",
    image: input.image || "assets/serenidad.jpg",
    alt: input.alt || "",
    featured: Boolean(input.featured),
    hidden: Boolean(input.hidden),
    tags: [...(input.tags || [])],
    blurb: input.blurb || "",
    paragraphs: [...(input.paragraphs || ["", ""])],
    note: input.note || "",
    sections: (input.sections || []).map((section) => ({
      title: section.title || "",
      text: section.text || "",
      items: [...(section.items || [])],
    })),
    closing: input.closing || "",
    facts: (input.facts || []).map((fact) => ({
      label: fact.label || "",
      value: fact.value || "",
    })),
  };
}

function slugify(value) {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "paquete";
}

function clonePaquete(source, name, existingIds) {
  const pkg = createPaquete(structuredClone(source));
  pkg.name = name.trim() || "Nuevo paquete";
  pkg.featured = false;
  pkg.hidden = false;
  let id = slugify(pkg.name);
  let count = 2;
  while (existingIds.includes(id)) id = `${slugify(pkg.name)}-${count++}`;
  pkg.id = id;
  return pkg;
}

function nextDuplicateName(baseName, packages) {
  const base = String(baseName || "Paquete").replace(/\s+\d+$/, "").trim() || "Paquete";
  const names = new Set(packages.map((pkg) => pkg.name));
  if (!names.has(base)) return base;
  let count = 2;
  while (names.has(`${base} ${count}`)) count += 1;
  return `${base} ${count}`;
}

const SHALOM_DEFAULT = {
  revision: 0,
  inicio: {
    slides: [
      { eyebrow: "", title: "Tu paz, nuestro\ncompromiso de amor" },
      { eyebrow: "", title: "Más de 20 años\nacompañando a las familias" },
    ],
    about: {
      eyebrow: "Acerca de nosotros",
      title: "Más de 20 años acompañando a las familias",
      lede: "En Servicios Funerarios Shalom tenemos más de 20 años de experiencia en el sector funerario y una misión muy clara: ayudar a las familias en uno de los momentos más difíciles de su vida. Creemos en un servicio digno, humano y transparente, por eso nuestros paquetes están diseñados para ser completos desde el principio, evitando cargos innecesarios y permitiendo que cualquier servicio adicional sea siempre una decisión de la familia.",
      image: "assets/about-equipo.webp",
      alt: "Equipo de Servicios Funerarios Shalom",
    },
    incluye: {
      eyebrow: "",
      title: "Capillas y servicio a domicilio",
      items: [
        {
          index: "01",
          title: "",
          role: "",
          text: "Contamos con una amplia disponibilidad de espacios de velación en la Zona Metropolitana de Guadalajara, Tepic y Coahuila, para brindar a cada familia alternativas cercanas y adecuadas para despedir a su ser querido.",
        },
        {
          index: "02",
          title: "",
          role: "",
          text: "También somos especialistas en servicios funerarios a domicilio, llevando hasta el hogar todo lo necesario para una velación digna y tranquila.",
        },
        {
          index: "03",
          title: "",
          role: "",
          text: "Capilla o domicilio, estamos preparados para acompañarle donde usted lo necesite.",
        },
      ],
    },
    contact: {
      eyebrow: "Contacto",
      title: "Deseo recibir información sobre los planes",
      lede: "Al llenar todos los campos, acepta que lo contactemos por correo o WhatsApp para recibir información. Tel. atención inmediata: 33 1338 3886.",
      points: [],
    },
    footer: "Tu paz, nuestro compromiso de amor · Servicios funerarios Shalom",
  },
  nosotros: {
    eyebrow: "Acerca de nosotros",
    title: "Más de 20 años acompañando a las familias",
    image: "assets/nosotros.jpg",
    alt: "Persona mayor en un espacio luminoso y tranquilo",
    mapImage: "assets/ubicaciones.jpg",
    mapAlt: "Capillas en Guadalajara",
    lede: "En Servicios Funerarios Shalom tenemos más de 20 años de experiencia en el sector funerario y una misión muy clara: ayudar a las familias en uno de los momentos más difíciles de su vida.\n\nCreemos en un servicio digno, humano y transparente, por eso nuestros paquetes están diseñados para ser completos desde el principio, evitando cargos innecesarios y permitiendo que cualquier servicio adicional sea siempre una decisión de la familia.",
    sectionTitle: "Capillas y servicio a domicilio",
    sectionBody: "Contamos con una amplia disponibilidad de espacios de velación en la Zona Metropolitana de Guadalajara, Tepic y Coahuila, para brindar a cada familia alternativas cercanas y adecuadas para despedir a su ser querido.\n\nTambién somos especialistas en servicios funerarios a domicilio, llevando hasta el hogar todo lo necesario para una velación digna y tranquila.",
    emphasis: "Capilla o domicilio, estamos preparados para acompañarle donde usted lo necesite.",
    brandTitle: "Servicios Funerarios Shalom",
    tagline: "Tu paz, nuestro compromiso de amor.",
    ctaLede: "",
    ctaPackages: "Ver paquetes",
    ctaContact: "Pedir información",
  },
  template: createPaquete({
    id: "plantilla",
    name: "Nuevo paquete",
    kicker: "Paquete",
    lead: "Una despedida a la medida",
    price: "$0.00",
    cta: "Comprar ahora",
    ctaHref: "#contact",
    image: "assets/serenidad.jpg",
    alt: "Presentación del paquete",
    tags: ["Etiqueta"],
    blurb: "Descripción breve del paquete.",
    paragraphs: [
      "Describa el ataúd y la presentación.",
      "Agregue el detalle que distingue a este paquete.",
    ],
    note: "Modalidad y destino final",
    sections: [
      {
        title: "Qué incluye",
        text: "Describa esta parte del servicio.",
        items: ["Elemento incluido"],
      },
    ],
    closing: "Cierre de la despedida.",
    facts: [
      { label: "Modalidad", value: "Domicilio o capilla" },
      { label: "Destino final", value: "Cremación o inhumación" },
    ],
  }),
  packages: [
    createPaquete({
      id: "serenidad",
      name: "Serenidad",
      kicker: "Paquete",
      lead: "Un homenaje digno, sobrio y completo",
      price: "$20,680.00",
      cta: "Comprar ahora",
      image: "assets/serenidad.jpg",
      alt: "Ataúd de madera en una sala de velación",
      featured: true,
      tags: ["Cremación", "A domicilio"],
      blurb: "Un homenaje digno, sobrio y completo.",
      paragraphs: [
        "Ataúd metálico cóncavo con acabado tipo madera, diseñado para brindar una presentación elegante y sobria durante la despedida de su ser querido.",
        "Su diseño busca conservar la calidez visual de la madera, evitando acabados de colores llamativos y ofreciendo una imagen más discreta y armoniosa para un momento tan importante.",
      ],
      note: "Capacidad de hasta 135 kg · Exclusivo para cremación",
      sections: [
        {
          title: "Velación a domicilio",
          text: "Velación de hasta 24 horas en el domicilio, acompañada del equipo necesario para crear un espacio digno y adecuado para la despedida.",
          items: ["Pedestal para ataúd", "4 candeleros", "Biombo", "Cristo", "40 sillas", "Toldo"],
        },
        {
          title: "Cortejo funerario",
          text: "Carroza de lujo para acompañar a su ser querido en su traslado y cortejo hacia el templo y posteriormente al cementerio o destino correspondiente.",
        },
        {
          title: "Preparación y presentación",
          text: "Nos encargamos de preparar a su ser querido con respeto y cuidado.",
          items: ["Preparación del cuerpo", "Arreglo estético", "Embalsamado"],
        },
        {
          title: "Recolección del cuerpo",
          text: "Realizamos la recolección en cualquier punto de la Zona Metropolitana de Guadalajara.",
          items: ["SEMEFO", "Hospitales", "Casa particular"],
        },
        {
          title: "Gestoría y documentación",
          text: "Le acompañamos en los trámites necesarios durante este momento.",
          items: ["Gestoría de trámites funerarios", "Pago del acta de defunción"],
        },
        {
          title: "Servicio de cafetería",
          text: "Para acompañar a familiares y amigos durante la velación. Servicio para hasta 100 personas.",
          items: ["Café", "Té", "Galletas", "50 piezas de pan"],
        },
      ],
      closing: "Una despedida digna, con la tranquilidad de tener todo preparado.",
      facts: [
        { label: "Modalidad", value: "Servicio exclusivamente a domicilio" },
        { label: "Destino final", value: "Cremación" },
      ],
    }),
    createPaquete({
      id: "memoria",
      name: "Memoria",
      lead: "Una despedida que honra cada recuerdo",
      price: "$26,180.00",
      compare: "$28,798.00",
      cta: "Contratar",
      image: "assets/memoria.jpg",
      alt: "Ataúd de madera con tapa plana",
      tags: ["Oferta", "Capilla o casa"],
      blurb: "Una despedida que honra cada recuerdo. Antes $28,798.",
      paragraphs: [
        "Ataúd de madera con tapa plana y finos acabados, elegido para brindar una presentación cálida, sobria y elegante en la despedida de un ser querido.",
        "Un diseño tradicional que combina la belleza natural de la madera con una terminación cuidada, pensado para acompañar un momento que merece ser tratado con dignidad y respeto.",
      ],
      note: "Ataúd de madera · Capilla o domicilio · Cremación o inhumación",
      sections: [
        { title: "Servicio a domicilio", text: "Velación y acompañamiento en el domicilio de la familia." },
        { title: "Servicio en capilla", text: "Velación en una de nuestras capillas, en un espacio preparado especialmente para recibir a familiares y amigos." },
        { title: "Cremación", text: "Incluye el servicio funerario necesario para acompañar el proceso de cremación y la entrega de la urna correspondiente." },
        { title: "Inhumación", text: "Servicio funerario preparado para acompañar el cortejo y la sepultura de su ser querido." },
        {
          title: "Un servicio funerario completo",
          text: "Memoria incluye todo lo necesario para acompañarle durante el proceso.",
          items: [
            "Velación de hasta 24 horas",
            "Servicio a domicilio o en capilla",
            "Recolección del cuerpo en la Zona Metropolitana de Guadalajara",
            "Carroza de lujo para cortejo funerario",
            "Preparación del cuerpo",
            "Arreglo estético",
            "Embalsamado",
            "Equipo de velación",
            "Servicio de cafetería",
            "Gestoría de trámites funerarios",
            "Pago del acta de defunción",
            "Opción de cremación o inhumación",
          ],
        },
      ],
      closing: "Una despedida digna, cálida y completa, pensada para honrar la vida y conservar el recuerdo.",
      facts: [
        { label: "Modalidad", value: "Domicilio o capilla" },
        { label: "Destino final", value: "Cremación o inhumación" },
      ],
    }),
    createPaquete({
      id: "legado",
      name: "Legado",
      lead: "Una despedida con distinción y carácter",
      price: "$30,450.00",
      cta: "Comprar ahora",
      image: "assets/legado.jpg",
      alt: "Ataúd de madera cóncavo sobre mármol",
      tags: ["Madera", "Liso o grabado"],
      blurb: "Una despedida con distinción y carácter.",
      paragraphs: [
        "Ataúd de madera con diseño cóncavo y finos acabados, creado para quienes desean una presentación más distinguida y una presencia especial durante la despedida de su ser querido.",
        "Su diseño cóncavo aporta una apariencia elegante y envolvente, disponible en acabado liso o con grabado de inspiración religiosa, de acuerdo con la disponibilidad.",
      ],
      note: "Ataúd de madera cóncavo · Acabado liso o religioso · Capilla o domicilio · Cremación o inhumación",
      sections: [
        { title: "Acabado liso", text: "Una presentación sobria, elegante y atemporal." },
        { title: "Grabado religioso", text: "Un detalle distintivo que incorpora un elemento de fe y significado a la presentación del ataúd. Los diseños con grabado religioso están sujetos a disponibilidad." },
        {
          title: "Un servicio funerario completo",
          text: "Legado incluye la atención necesaria para acompañar a la familia durante cada etapa.",
          items: [
            "Velación de hasta 24 horas",
            "Servicio a domicilio o en capilla",
            "Recolección del cuerpo en la Zona Metropolitana de Guadalajara",
            "Carroza de lujo para cortejo funerario",
            "Preparación del cuerpo",
            "Arreglo estético",
            "Embalsamado",
            "Equipo de velación",
            "Servicio de cafetería",
            "Gestoría de trámites funerarios",
            "Pago del acta de defunción",
            "Opción de cremación o inhumación",
          ],
        },
      ],
      closing: "Una opción pensada para brindar una despedida elegante, significativa y digna, cuidando cada detalle en un momento que merece todo nuestro respeto.",
      facts: [
        { label: "Acabado", value: "Liso o grabado religioso" },
        { label: "Destino final", value: "Cremación o inhumación" },
      ],
    }),
    createPaquete({
      id: "paz",
      name: "Paz",
      kicker: "La insignia de Shalom",
      lead: "La elegancia de una despedida con significado",
      price: "$35,700.00",
      cta: "Comprar ahora",
      image: "assets/paz.jpg",
      alt: "Ataúd de madera con detalle religioso",
      tags: ["Insignia", "Detalle de fe"],
      blurb: "La elegancia de una despedida con significado.",
      paragraphs: [
        "Paz es nuestra insignia. En Shalom creemos que una despedida digna también puede estar acompañada de belleza, distinción y significado. Por eso, Paz presenta un ataúd de madera cuidadosamente elaborado, con detalles que hacen de su diseño una pieza especial.",
        "Su acabado incorpora grabados y molduras en madera, cuidadosamente integrados para realzar su presencia y darle una apariencia elegante y distinguida.",
      ],
      note: "Ataúd de madera · Grabados y molduras · Detalles religiosos · Capilla o domicilio · Cremación o inhumación",
      sections: [
        {
          title: "Detalles que hacen la diferencia",
          text: "El ataúd puede incorporar una pieza religiosa desmontable. Las piezas y diseños están sujetos a disponibilidad.",
          items: ["Cristo", "Virgen", "San Judas"],
        },
        {
          title: "Un servicio a la altura de cada detalle",
          text: "Paz incluye todo lo necesario para brindar una atención funeraria completa y acompañar a la familia durante todo el proceso.",
          items: [
            "Velación de hasta 24 horas",
            "Servicio a domicilio o en capilla",
            "Recolección del cuerpo en la Zona Metropolitana de Guadalajara",
            "Carroza de lujo para cortejo funerario",
            "Preparación del cuerpo",
            "Arreglo estético",
            "Embalsamado",
            "Equipo de velación",
            "Servicio de cafetería",
            "Gestoría de trámites funerarios",
            "Pago del acta de defunción",
            "Opción de cremación o inhumación",
          ],
        },
      ],
      closing: "PAZ — Tu paz, nuestro compromiso de amor. Una presentación distinguida, un servicio completo y el cuidado de cada detalle.",
      facts: [
        { label: "Detalle", value: "Cristo, Virgen o San Judas" },
        { label: "Destino final", value: "Cremación o inhumación" },
      ],
    }),
  ],
};

const STORAGE_KEY = "shalom-content";

function readStoredContent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

async function loadContent() {
  let best = structuredClone(SHALOM_DEFAULT);
  const local = readStoredContent();
  if (local && local.packages && (local.revision || 0) >= (best.revision || 0)) best = local;
  for (const url of ["/api/content", "data/content.json"]) {
    try {
      const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) continue;
      const file = await response.json();
      if (file && file.packages && (file.revision || 0) >= (best.revision || 0)) best = file;
    } catch (error) {
      /* Optional until the first save. */
    }
  }
  best.packages = (best.packages || []).map((pkg) => createPaquete(pkg));
  best.template = createPaquete(best.template || SHALOM_DEFAULT.template);
  best.nosotros = { ...SHALOM_DEFAULT.nosotros, ...(best.nosotros || {}) };
  best.inicio = { ...SHALOM_DEFAULT.inicio, ...(best.inicio || {}) };
  best.inicio.about = { ...SHALOM_DEFAULT.inicio.about, ...(best.inicio.about || {}) };
  return best;
}

async function saveContent(content) {
  content.revision = Date.now();
  try {
    const slim = { ...content };
    delete slim.miniatures;
    delete slim.miniatureStamps;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch (error) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  try {
    const response = await fetch("/api/content", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    if (response.ok) return "archivo";
    if (response.status === 401) throw new Error("Sesión expirada");
  } catch (error) {
    if (error && error.message === "Sesión expirada") throw error;
    /* The page still keeps the edit in this browser when possible. */
  }
  return "navegador";
}

window.SHALOM_DEFAULT = SHALOM_DEFAULT;
window.ShalomModel = {
  createPaquete,
  clonePaquete,
  nextDuplicateName,
  slugify,
  loadContent,
  saveContent,
  readStoredContent,
};
