import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { NAV_LINKS } from '../lib/constants';
import footerBg from '../assets/footer-bg.png';
import './Mundos.css';
import { 
  getAvailableEpubs,
  findMatchingEpub,
  getEpubDownloadUrl 
} from '../lib/book_service.ts';

// Assets
import storyZelda from '../assets/story_zelda_final.jfif';
import storyMistborn from '../assets/story_mistborn_final.png';
import storyStorm from '../assets/story_storm_final.png';
import storyPadrino from '../assets/story_padrino_final.png';
import storyFrankenstein from '../assets/story_frankenstein_final.png';

const WORLDS_DATA = [
  {
    title: 'The Legend of Zelda',
    image: storyZelda,
    quote: 'Ah, este reino. Conozco bien su melodía, aunque tienen la exasperante costumbre de cambiar los instrumentos cada tantos siglos...',
    description: 'Aquí hablan del tiempo como un río y de la valentía frente al miedo... He visto mundos enteros desmoronarse por mucho menos, pero este lugar tiene una extraña terquedad. Cuando la oscuridad amenaza con tragarlo todo, siempre terminan confiándole el destino del mundo a un muchacho vestido de verde. Qué alarmante falta de sentido de la moda, si me preguntas. Aún así, he escuchado a sus ladronas del desierto hablar de honor, y a sus sombras filosofar bajo la lluvia. Es un mundo donde la luz y la oscuridad bailan un vals interminable alrededor de tres triángulos dorados. Adelante, explora. Pero te lo advierto: ten cuidado con las canciones que aprendas aquí, podrías terminar regresando al ayer antes de haber llegado al mañana.',
    files: ['Zelda']
  },
  {
    title: 'Nacidos de la bruma',
    image: storyMistborn,
    quote: 'He visto cielos de muchos colores, pero el rojo asfixiante de este mundo tiene un encanto... macabro.',
    description: 'Todo este imperio está construido sobre el eco de un hombre del pasado que escribió: "Afirman que tengo el futuro del mundo en mis brazos". Pobrecillo. Marchó hacia su gran destino seguido por un compañero de viaje que parecía odiarlo en silencio. ¿El resultado? Mil años después de aquel misterioso desenlace, la humanidad no encontró la salvación. Encontró ceniza, esclavitud y a un Lord Legislador de hierro. Pero el destino es caprichoso. Ahora, el futuro de este mundo marchito ya no depende de profecías rimbombantes ni de héroes elegidos. Depende de la sonrisa peligrosa de un ladrón medio loco y de una muchacha de la calle que aún no sabe lo que es capaz de hacer cuando traga un poco de metal. Adelante, entra en la bruma... si no te molesta mancharte de hollín.',
    files: ['Imperio Final', 'Pozo de la Ascension', 'Heroe de las Eras']
  },
  {
    title: 'El ritmo de la guerra',
    image: storyStorm,
    quote: 'Guarda tu espada y saca tus pergaminos. Estás a punto de entrar a una guerra donde el descubrimiento de un erudito es más letal que un millar de soldados.',
    description: 'Este mundo está a un paso de romperse en pedazos, no por la fuerza bruta, sino por el peso de un conocimiento que nadie estaba preparado para desenterrar. Y te lo digo yo, que estuve allí. Tuve que arremangarme, contar la historia de un perro legendario para salvar la cordura de un amigo, y bailar en la cuerda floja frente a los mismísimos dioses. Afina bien el oído; la sinfonía de la destrucción está a punto de comenzar.',
    files: ['Ritmo de la guerra']
  },
  {
    title: 'El Padrino',
    image: storyPadrino,
    quote: 'He visto imperios galácticos derrumbarse y reyes inmortales perder la cabeza, pero este rincón del multiverso tiene una visión del poder que resulta… fascinante.',
    description: 'Aquí, los emperadores no usan coronas brillantes ni empuñan espadas mágicas, sino trajes a medida y el inquebrantable peso de un favor prestado. En estas páginas descubrirás que el honor no es exclusivo de los caballeros de brillante armadura; a veces, los códigos morales más estrictos pertenecen a los hombres que se manchan las manos de sangre, vino y aceite de oliva. Es la historia de un trono forjado en las sombras y de un hijo que juró nunca ser como su padre, solo para descubrir que la lealtad a la sangre tira con más fuerza que la gravedad. Entra, amigo mío. Ven el día de la boda de su hija, y quizás, si muestras el respeto adecuado, te hagan una oferta que sencillamente no podrás rechazar.',
    files: ['Padrino']
  },
  {
    title: 'Frankenstein — El Moderno Prometeo',
    image: storyFrankenstein,
    quote: 'He visto a dioses moldear hombres, pero nada es tan fascinante y patético como un mortal jugando a ser deidad con aguja, hilo y sobras de cementerio.',
    description: 'La ironía, amigo mío, es deliciosa: esta criatura, cosida con retazos robados a la muerte, tenía más capacidad de amar que los hombres civilizados que la recibieron a pedradas. Amó este mundo hasta que el mundo le escupió en la cara. Así comienza una danza macabra. El creador huye aterrorizado de su propia arrogancia, y el hijo consagra su miseria a cazar a quien lo abandonó en la oscuridad. Abrígate bien; en los hielos del norte descubrirás que la línea entre víctima y verdugo es tan fina como una sutura quirúrgica, y te preguntarás quién es el verdadero monstruo: el científico sin corazón, o la aberración que lloraba porque nadie le devolía la sonrisa.',
    files: ['Frankenstein']
  }
];

export default function Mundos() {
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const files = await getAvailableEpubs();
    setAvailableFiles(files);
  };

  const handleExplore = (fileName: string) => {
    const match = findMatchingEpub(fileName, availableFiles);
    if (match) {
      const url = getEpubDownloadUrl(match);
      window.open(url, '_blank');
    } else {
      alert(`Aún no hemos encontrado el registro de "${fileName}" en el Archivo.`);
    }
  };

  return (
    <div className="mundos-page">
      <Header />
      
      <main className="mundos-main">
        <section className="mundos-hero">
          <div className="hc-container">
            <h1 className="mundos-title">CRÓNICAS DEL MULTIVERSO</h1>
            <p className="mundos-subtitle">
              He viajado por más mundos de los que puedo contar, y cada uno tiene su propia canción, 
              su propio dolor y sus propios triángulos dorados. Deja que te guíe por los más... interesantes.
            </p>
          </div>
        </section>

        <section className="mundos-list">
          {WORLDS_DATA.map((world, index) => (
            <div key={index} className={`world-entry ${index % 2 === 0 ? 'even' : 'odd'}`}>
              <div className="world-image-container">
                <img src={world.image} alt={world.title} className="world-image" />
                <div className="world-image-overlay" />
              </div>
              <div className="world-info">
                <div className="world-info-content">
                  <h2 className="world-name">{world.title}</h2>
                  <div className="world-quote-box">
                    <span className="material-symbols-outlined quote-icon">format_quote</span>
                    <p className="world-quote">{world.quote}</p>
                  </div>
                  <div className="world-description">
                    <p>{world.description}</p>
                  </div>
                  
                  <div className="world-files-grid">
                    {world.files.map((fileName) => {
                      const isAvailable = !!findMatchingEpub(fileName, availableFiles);
                      return (
                        <button 
                          key={fileName}
                          className={`hc-btn-primary explore-btn ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => handleExplore(fileName)}
                        >
                          <span className="material-symbols-outlined">auto_stories</span>
                          {world.files.length > 1 ? fileName.toUpperCase() : 'VER MUNDO'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="hc-footer">
        <div className="hc-footer-inner" style={{ backgroundImage: `url(${footerBg})` }}>
          <div className="hc-footer-overlay" />
          <div className="hc-footer-brand">
            <div className="hc-footer-logo">Crónicas de un Saltamundos</div>
            <p className="hc-footer-copy">© Crónicas de un Saltamundos. TODOS LOS DERECHOS RESERVADOS.</p>
          </div>
          <nav className="hc-footer-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} to={link.path}>{link.name}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
