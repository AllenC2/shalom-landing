function packageTheme(input = {}) {
  const theme = String(input.theme || "").toLowerCase();
  if (theme === "gold" || theme === "luxury" || theme === "sand") return theme;
  return input.featured ? "gold" : "sand";
}

function packageCardClass(pkg) {
  const theme = packageTheme(pkg);
  if (theme === "gold") return "card-lime";
  if (theme === "luxury") return "card-luxury";
  return "card-sand";
}

function packageBuyModifier(pkg) {
  const theme = packageTheme(pkg);
  if (theme === "gold") return "is-gold";
  if (theme === "luxury") return "is-luxury";
  return "";
}

function createPaquete(input = {}) {
  const theme = packageTheme(input);
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
    theme,
    featured: theme === "gold",
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
  pkg.theme = "sand";
  pkg.featured = false;
  pkg.hidden = false;
  let id = slugify(pkg.name);
  let count = 2;
  while (existingIds.includes(id)) id = `${slugify(pkg.name)}-${count++}`;
  pkg.id = id;
  return pkg;
}

function nextDuplicateName(baseName, packages, fallback = "Paquete") {
  const base = String(baseName || fallback).replace(/\s+\d+$/, "").trim() || fallback;
  const names = new Set(packages.map((pkg) => pkg.name));
  if (!names.has(base)) return base;
  let count = 2;
  while (names.has(`${base} ${count}`)) count += 1;
  return `${base} ${count}`;
}

function createCapilla(input = {}) {
  const cover = input.image || "assets/capilla-1.jpg";
  const gallery = Array.isArray(input.images) && input.images.length
    ? input.images.map((item) => (typeof item === "string" ? item : item?.src || cover)).filter(Boolean)
    : [cover];
  return {
    id: input.id || "",
    name: input.name || "Nueva capilla",
    colonia: input.colonia || "",
    municipio: input.municipio || "",
    image: cover,
    alt: input.alt || "",
    images: gallery,
    features: [...(input.features || [])],
    description: input.description || "",
    whatsapp: input.whatsapp || "523313383886",
    whatsappMessage: input.whatsappMessage || "",
    cta: input.cta || "Contratar",
    hidden: Boolean(input.hidden),
  };
}

function cloneCapilla(source, name, existingIds) {
  const item = createCapilla(structuredClone(source));
  item.name = name.trim() || "Nueva capilla";
  item.hidden = false;
  let id = slugify(item.name) || "capilla";
  let count = 2;
  while (existingIds.includes(id)) id = `${slugify(item.name) || "capilla"}-${count++}`;
  item.id = id;
  return item;
}

function chapelWhatsAppUrl(capilla) {
  const phone = String(capilla.whatsapp || "523313383886").replace(/\D/g, "") || "523313383886";
  const message = capilla.whatsappMessage
    || `Hola, me interesa contratar la capilla ${capilla.name || ""}${capilla.colonia ? ` en ${capilla.colonia}` : ""}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function createServicio(input = {}) {
  return createCapilla({
    ...input,
    name: input.name || "Nuevo servicio",
  });
}

function cloneServicio(source, name, existingIds) {
  const item = createServicio(structuredClone(source));
  item.name = name.trim() || "Nuevo servicio";
  item.hidden = false;
  let id = slugify(item.name) || "servicio";
  let count = 2;
  while (existingIds.includes(id)) id = `${slugify(item.name) || "servicio"}-${count++}`;
  item.id = id;
  return item;
}

function servicioWhatsAppUrl(servicio) {
  const phone = String(servicio.whatsapp || "523313383886").replace(/\D/g, "") || "523313383886";
  const message = servicio.whatsappMessage
    || `Hola, me interesa contratar el servicio ${servicio.name || ""}${servicio.colonia ? ` en ${servicio.colonia}` : ""}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const ARTICULO_MAX_IMAGES = 20;

function sanitizeArticuloHtml(value) {
  const raw = String(value || "");
  if (typeof document === "undefined") {
    return raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "");
  }
  const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "A", "H2", "H3", "BLOCKQUOTE"]);
  const wrap = document.createElement("div");
  wrap.innerHTML = raw;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }
      if (!allowed.has(child.tagName)) {
        const parent = child.parentNode;
        while (child.firstChild) parent.insertBefore(child.firstChild, child);
        child.remove();
        return;
      }
      [...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (child.tagName === "A" && name === "href") {
          const href = String(attr.value || "").trim();
          if (!/^(https?:|mailto:|#)/i.test(href)) child.removeAttribute(attr.name);
          else {
            child.setAttribute("href", href);
            child.setAttribute("rel", "noopener noreferrer");
            if (/^https?:/i.test(href)) child.setAttribute("target", "_blank");
          }
          return;
        }
        child.removeAttribute(attr.name);
      });
      walk(child);
    });
  };
  walk(wrap);
  return wrap.innerHTML.trim();
}

function createArticulo(input = {}) {
  const images = (Array.isArray(input.images) ? input.images : [])
    .map((item) => {
      if (typeof item === "string") return { src: item, alt: "" };
      const src = item?.src || item?.url || "";
      if (!src) return null;
      return { src, alt: String(item.alt || "") };
    })
    .filter(Boolean)
    .slice(0, ARTICULO_MAX_IMAGES);
  const date = String(input.date || "").slice(0, 10);
  return {
    id: input.id || "",
    title: input.title || "Nuevo artículo",
    date: date || new Date().toISOString().slice(0, 10),
    body: sanitizeArticuloHtml(input.body || "<p></p>"),
    images,
    hidden: Boolean(input.hidden),
  };
}

function cloneArticulo(source, name, existingIds) {
  const item = createArticulo(structuredClone(source));
  item.title = String(name || "").trim() || "Nuevo artículo";
  item.hidden = false;
  let id = slugify(item.title) || "articulo";
  let count = 2;
  while (existingIds.includes(id)) id = `${slugify(item.title) || "articulo"}-${count++}`;
  item.id = id;
  return item;
}

const SHALOM_DEFAULT = {
  revision: 0,
  inicio: {
    slides: [
      { eyebrow: "", title: "Tu paz, nuestro\ncompromiso de amor" },
      { eyebrow: "", title: "Más de 20 años\nacompañando a las familias" },
    ],
    about: {
      brand: "Servicios Funerarios Shalom",
      title: "Más de 20 años acompañando a las familias",
      lede: "Servicio digno, humano y transparente para el momento más difícil. Paquetes completos, sin cargos innecesarios.",
      image: "assets/about-equipo.webp",
      alt: "Equipo de Servicios Funerarios Shalom",
      ctaPackages: "Ver paquetes",
      ctaWhatsapp: "Enviar un Whatsapp",
      whatsappHref: "https://wa.me/523313383886",
    },
    incluye: {
      eyebrow: "",
      title: "Capillas y servicios a domicilio",
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
  paquetes: {
    eyebrow: "Paquetes",
    title: "Elija el plan que mejor acompañe a su familia",
  },
  capillaTemplate: createCapilla({
    id: "plantilla-capilla",
    name: "Nueva capilla",
    colonia: "Colonia",
    municipio: "Municipio",
    image: "assets/capilla-1.jpg",
    alt: "Interior de capilla",
    images: ["assets/capilla-1.jpg", "assets/capilla-2.jpg"],
    features: ["Aire acondicionado", "Estacionamiento"],
    description: "Describa la capilla, su capacidad y los servicios disponibles en este espacio.",
  }),
  capillas: [
    createCapilla({
      id: "capilla-guadalajara-centro",
      name: "Capilla Centro",
      colonia: "Centro",
      municipio: "Guadalajara",
      image: "assets/capilla-1.jpg",
      alt: "Capilla de velación en Guadalajara Centro",
      images: ["assets/capilla-1.jpg", "assets/capilla-2.jpg"],
      features: ["Aire acondicionado", "Estacionamiento", "Sala de descanso"],
      description: "Espacio de velación amplio y sobrio en el Centro de Guadalajara, pensado para acompañar a las familias con dignidad y cercanía.",
    }),
    createCapilla({
      id: "capilla-zapopan-lomas",
      name: "Capilla Lomas",
      colonia: "Lomas del Valle",
      municipio: "Zapopan",
      image: "assets/capilla-3.jpg",
      alt: "Capilla de velación en Zapopan",
      images: ["assets/capilla-3.jpg", "assets/capilla-4.jpg"],
      features: ["Aire acondicionado", "Cafetería", "Acceso para silla de ruedas"],
      description: "Capilla luminosa en Zapopan, con ambientes serenos para una despedida íntima y organizada.",
    }),
    createCapilla({
      id: "servicio-a-domicilio",
      name: "Servicio a domicilio",
      colonia: "Zona Metropolitana",
      municipio: "Guadalajara",
      image: "assets/capilla-2.jpg",
      alt: "Servicio funerario a domicilio",
      images: ["assets/capilla-2.jpg", "assets/capilla-4.jpg"],
      features: ["Equipo completo", "Montaje en domicilio", "Atención 24 h"],
      description: "Llevamos hasta el hogar todo lo necesario para una velación digna y tranquila, con el acompañamiento de nuestro equipo.",
    }),
  ],
  servicioTemplate: createServicio({
    id: "plantilla-servicio",
    name: "Nuevo servicio",
    colonia: "Colonia",
    municipio: "Municipio",
    image: "assets/capilla-1.jpg",
    alt: "Servicio funerario",
    images: ["assets/capilla-1.jpg", "assets/capilla-2.jpg"],
    features: ["Atención personalizada", "Disponibilidad inmediata"],
    description: "Describa el servicio, qué incluye y cómo acompaña a las familias.",
  }),
  serviciosCatalog: [],
  nosotros: {
    emptyTitle: "Pronto compartiremos más de nosotros",
    emptyLede: "Estamos preparando historias y momentos de la familia Shalom.",
  },
  articuloTemplate: createArticulo({
    id: "plantilla-articulo",
    title: "Nuevo artículo",
    body: "<p>Escriba aquí el contenido del artículo.</p>",
    images: [],
  }),
  articulos: [
    createArticulo({
      id: "mas-de-20-anos",
      title: "Más de 20 años acompañando a las familias",
      date: "2004-01-01",
      body: "<p>En Servicios Funerarios Shalom tenemos más de 20 años de experiencia en el sector funerario y una misión muy clara: ayudar a las familias en uno de los momentos más difíciles de su vida.</p><p>Creemos en un servicio digno, humano y transparente, por eso nuestros paquetes están diseñados para ser completos desde el principio.</p>",
      images: [{ src: "assets/nosotros.jpg", alt: "Persona mayor en un espacio luminoso y tranquilo" }],
    }),
  ],
  servicios: {
    sectionTitle: "Capillas y servicios a domicilio",
    sectionBody: "Contamos con una amplia disponibilidad de espacios de velación en la Zona Metropolitana de Guadalajara, Tepic y Coahuila, para brindar a cada familia alternativas cercanas y adecuadas para despedir a su ser querido.\n\nTambién somos especialistas en servicios funerarios a domicilio, llevando hasta el hogar todo lo necesario para una velación digna y tranquila.",
    emphasis: "Capilla o domicilio, estamos preparados para acompañarle donde usted lo necesite.",
    mapImage: "assets/ubicaciones.jpg",
    mapAlt: "Capillas en Guadalajara",
    catalogEyebrow: "Servicios",
    catalogTitle: "Nuestros servicios",
    catalogLede: "Conozca cada opción con detalle y elija el acompañamiento que mejor responda a su familia.",
    ctaLede: "",
    ctaPackages: "Ver paquetes",
    ctaContact: "Pedir información",
    commentsEyebrow: "Comentarios",
    commentsTitle: "Testimonios",
    commentsLede: "Historias reales de acompañamiento digno y cercano. Lea lo que dicen quienes ya pasaron por este momento con nosotros.",
    commentsCta: "Dejar mis comentarios",
    commentsFormTitle: "Deje su comentario",
    commentsSuccess: "Gracias. Su comentario quedó registrado y será revisado antes de publicarse.",
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
  best.capillas = (Array.isArray(best.capillas) ? best.capillas : SHALOM_DEFAULT.capillas).map((item) => createCapilla(item));
  best.capillaTemplate = createCapilla(best.capillaTemplate || SHALOM_DEFAULT.capillaTemplate);
  best.serviciosCatalog = (Array.isArray(best.serviciosCatalog) ? best.serviciosCatalog : SHALOM_DEFAULT.serviciosCatalog).map((item) =>
    createServicio(item)
  );
  best.servicioTemplate = createServicio(best.servicioTemplate || SHALOM_DEFAULT.servicioTemplate);
  best.articuloTemplate = createArticulo(best.articuloTemplate || SHALOM_DEFAULT.articuloTemplate);
  const legacyNosotros = best.nosotros || {};
  let articulos = Array.isArray(best.articulos) ? best.articulos.map((item) => createArticulo(item)) : [];
  if (!articulos.length && (legacyNosotros.title || legacyNosotros.lede)) {
    articulos = [
      createArticulo({
        id: "mas-de-20-anos",
        title: legacyNosotros.title || "Más de 20 años acompañando a las familias",
        date: "2004-01-01",
        body: `<p>${String(legacyNosotros.lede || "").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
        images: legacyNosotros.image
          ? [{ src: legacyNosotros.image, alt: legacyNosotros.alt || "" }]
          : [],
      }),
    ];
  }
  best.articulos = articulos.length ? articulos : SHALOM_DEFAULT.articulos.map((item) => createArticulo(item));
  best.nosotros = {
    ...SHALOM_DEFAULT.nosotros,
    emptyTitle: legacyNosotros.emptyTitle || SHALOM_DEFAULT.nosotros.emptyTitle,
    emptyLede: legacyNosotros.emptyLede || SHALOM_DEFAULT.nosotros.emptyLede,
  };
  const serviciosLegacy = {};
  for (const key of [
    "sectionTitle",
    "sectionBody",
    "emphasis",
    "mapImage",
    "mapAlt",
    "catalogEyebrow",
    "catalogTitle",
    "catalogLede",
    "ctaLede",
    "ctaPackages",
    "ctaContact",
  ]) {
    if (legacyNosotros[key] != null && !(key in (best.servicios || {}))) {
      serviciosLegacy[key] = legacyNosotros[key];
    }
  }
  best.servicios = { ...SHALOM_DEFAULT.servicios, ...serviciosLegacy, ...(best.servicios || {}) };
  best.inicio = { ...SHALOM_DEFAULT.inicio, ...(best.inicio || {}) };
  const aboutMerged = { ...SHALOM_DEFAULT.inicio.about, ...(best.inicio.about || {}) };
  delete aboutMerged.eyebrow;
  best.inicio.about = aboutMerged;
  best.paquetes = { ...SHALOM_DEFAULT.paquetes, ...(best.paquetes || {}) };
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
  createCapilla,
  cloneCapilla,
  createServicio,
  cloneServicio,
  createArticulo,
  cloneArticulo,
  sanitizeArticuloHtml,
  ARTICULO_MAX_IMAGES,
  chapelWhatsAppUrl,
  servicioWhatsAppUrl,
  nextDuplicateName,
  slugify,
  packageTheme,
  packageCardClass,
  packageBuyModifier,
  loadContent,
  saveContent,
  readStoredContent,
};
