/**
 * Decap CMS Custom Preview Templates
 * ANPA Ensino Rabadeira — Warm Cream & Teal Design System
 */

(function () {
  const mesesGalego = [
    "xaneiro", "febreiro", "marzo", "abril", "maio", "xuño",
    "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"
  ];

  function formatGalicianDate(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    return `${d.getDate()} de ${mesesGalego[d.getMonth()]} de ${d.getFullYear()}`;
  }

  // ===== POST / NOTICIA PREVIEW =====
  const PostPreview = createClass({
    render: function () {
      const entry = this.props.entry;
      const title = entry.getIn(['data', 'title']) || 'Título da nova';
      const date = entry.getIn(['data', 'date']);
      const category = entry.getIn(['data', 'category']) || 'Novas';
      const image = entry.getIn(['data', 'image']);
      const imageSrc = image ? this.props.getAsset(image) : null;
      const formattedDate = date ? formatGalicianDate(date) : '';

      return h('div', { className: 'preview-root' },
        h('article', { className: 'post-single container' },
          h('a', { href: '#', className: 'post-single__back', onClick: (e) => e.preventDefault() }, '← Voltar a Novas'),
          h('header', null,
            category ? h('span', { className: 'post-single__category' }, category) : null,
            h('h1', null, title),
            formattedDate ? h('time', { className: 'post-single__date' }, `📅 ${formattedDate}`) : null,
            imageSrc ? h('img', { src: imageSrc.toString(), alt: title, className: 'post-single__image' }) : null
          ),
          h('div', { className: 'post-content' }, this.props.widgetFor('body'))
        )
      );
    }
  });

  // ===== EXTRAESCOLARES PREVIEW =====
  const ExtraescolaresPreview = createClass({
    render: function () {
      const entry = this.props.entry;
      const data = entry.getIn(['data']).toJS();
      const academicYear = data.academic_year || '2026-2027';
      const scheduleImg = data.schedule_image ? this.props.getAsset(data.schedule_image) : null;
      const activities = data.activities || [];
      const membership = data.membership || {};
      const pricingTable = data.pricing_table || [];

      return h('div', { className: 'preview-root container' },
        h('h1', { style: { marginTop: '1.5rem', marginBottom: '1rem', color: '#13406a' } }, `Actividades Extraescolares ${academicYear}`),
        data.intro ? h('p', null, data.intro) : null,
        data.subintro ? h('p', null, data.subintro) : null,

        // Horario oficial
        scheduleImg ? h('div', { className: 'schedule-card', style: { margin: '2rem 0' } },
          h('div', { className: 'schedule-card__header' },
            h('h3', { className: 'schedule-card__title' }, `Horario Xeral Extraescolares (${academicYear})`)
          ),
          h('div', { className: 'schedule-card__scroll' },
            h('img', { src: scheduleImg.toString(), alt: `Horario ${academicYear}`, className: 'schedule-card__img' })
          )
        ) : null,

        data.deadlines_note ? h('p', null, data.deadlines_note) : null,

        // Alta de socio
        membership.title ? h('div', { className: 'callout-box', style: { margin: '2rem 0' } },
          h('h3', null, membership.title),
          membership.non_member_note ? h('p', null, membership.non_member_note) : null,
          h('div', { className: 'callout-box__actions' },
            membership.join_label ? h('span', { className: 'btn-action' }, membership.join_label) : null,
            membership.non_member_label ? h('span', { className: 'btn-action' }, membership.non_member_label) : null
          )
        ) : null,

        // Listado de actividades
        h('h2', { style: { marginTop: '2rem', marginBottom: '1rem' } }, `Listado de actividades (${activities.length})`),
        h('div', { className: 'activity-cards' },
          activities.map((act, index) => {
            let badge = null;
            if (act.status === 'full') {
              badge = h('span', { className: 'status-badge status-badge--full' }, 'Completa');
            } else if (act.status === 'partial') {
              badge = h('span', { className: 'status-badge status-badge--partial' }, 'Parcialmente completa');
            }

            return h('article', { key: act.id || index, className: 'activity-card' },
              h('div', { className: 'activity-card__header' },
                h('h3', { className: 'activity-card__title' }, act.name || 'Actividade'),
                badge
              ),
              h('div', { className: 'activity-card__details' },
                h('span', { className: 'activity-card__detail-item' }, h('strong', null, 'Etapa: '), act.stage || ''),
                h('span', { className: 'activity-card__detail-item' }, h('strong', null, 'Prezo: '), act.price || ''),
                act.provider ? h('span', { className: 'activity-card__detail-item' }, h('strong', null, 'Imparte: '), act.provider) : null
              ),
              act.status_note ? h('p', { className: 'activity-card__note' }, act.status_note) : null,
              act.status !== 'full' && act.registration_url ? h('div', null,
                h('span', { className: 'btn-action' }, act.button_label || 'Inscrición')
              ) : null
            );
          })
        ),

        // Cadro de tarifas
        pricingTable.length > 0 ? h('div', { style: { marginTop: '2.5rem' } },
          h('h2', null, `Cadro de tarifas e cotas (${academicYear})`),
          h('div', { className: 'pricing-table-container' },
            h('table', { className: 'pricing-table' },
              h('thead', null,
                h('tr', null,
                  h('th', null, 'Actividade'),
                  h('th', null, 'Horas'),
                  h('th', null, 'Cota mensual')
                )
              ),
              h('tbody', null,
                pricingTable.map((item, idx) =>
                  h('tr', { key: idx },
                    h('td', null, h('strong', null, item.name)),
                    h('td', null, item.hours),
                    h('td', null, item.price)
                  )
                )
              )
            )
          )
        ) : null
      );
    }
  });

  // ===== PÁXINAS DE INFORMACIÓN (FLEXIBLE PREVIEW) =====
  function renderBlocks(blocks, getAsset) {
    if (!blocks || !Array.isArray(blocks)) return null;
    return blocks.map((blk, idx) => {
      if (!blk) return null;
      const type = blk.type;
      if (type === 'text_block' || type === 'text') {
        return h('div', { key: idx, style: { margin: '1.5rem 0' } },
          blk.title ? h('h2', null, blk.title) : null,
          blk.body ? h('p', null, blk.body) : (blk.content ? h('p', null, blk.content) : null)
        );
      }
      if (type === 'callout_block' || type === 'callout') {
        return h('div', { key: idx, className: `callout-box callout-box--${blk.style || 'info'}`, style: { margin: '1.5rem 0' } },
          blk.title ? h('h3', null, blk.title) : null,
          blk.text ? h('p', null, blk.text) : (blk.body ? h('p', null, blk.body) : null),
          blk.url && blk.url_label ? h('p', { style: { marginTop: '0.75rem' } },
            h('span', { className: 'btn-action' }, blk.url_label)
          ) : null
        );
      }
      if (type === 'image_block' || type === 'image') {
        const imgSrc = blk.image ? getAsset(blk.image) : null;
        if (!imgSrc) return null;
        return h('figure', { key: idx, style: { margin: '1.5rem 0' } },
          h('img', { src: imgSrc.toString(), alt: blk.image_alt || '', style: { maxWidth: '100%', borderRadius: '8px' } }),
          blk.caption ? h('figcaption', { style: { fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' } }, blk.caption) : null
        );
      }
      if (type === 'document_block' || type === 'document') {
        return h('div', { key: idx, className: 'doc-card', style: { margin: '1.25rem 0' } },
          h('div', { className: 'doc-card__main' },
            h('div', { className: 'doc-card__info' },
              h('h3', { className: 'doc-card__title' }, blk.title || 'Documento PDF'),
              blk.description ? h('p', { className: 'doc-card__meta' }, blk.description) : null
            )
          ),
          h('div', { className: 'doc-card__actions' },
            h('span', { className: 'doc-btn doc-btn--primary' }, blk.button_label || 'Abrir PDF')
          )
        );
      }
      if (type === 'button_block' || type === 'button') {
        return h('div', { key: idx, style: { margin: '1.5rem 0' } },
          h('span', { className: 'btn-action btn-action--primary' }, blk.label || 'Botón de acción'),
          blk.note ? h('p', { style: { fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' } }, blk.note) : null
        );
      }
      return null;
    });
  }

  const PagePreview = createClass({
    render: function () {
      const entry = this.props.entry;
      const data = entry.getIn(['data']).toJS();
      const title = data.title || 'Título da páxina';
      const image = data.image ? this.props.getAsset(data.image) : null;
      const getAsset = this.props.getAsset;

      return h('div', { className: 'preview-root container page-content' },
        image ? h('div', { className: 'post-single__image' },
          h('img', { src: image.toString(), alt: title })
        ) : null,
        h('h1', { style: { marginTop: '1.5rem', marginBottom: '1rem', color: '#13406a' } }, title),
        h('div', { className: 'post-content' },
          data.intro ? h('p', null, data.intro) : null,

          // 1. Top flexible sections
          renderBlocks(data.top_sections, getAsset),

          // 2. Madrugadores structured
          data.schedule_hours ? h('p', null,
            'O servizo de madrugadores está dispoñible de ',
            h('strong', null, data.schedule_hours),
            ' con posibilidade de almorzo. O servizo é xestionado pola empresa ',
            data.provider_name || 'Jardanay', '.'
          ) : null,

          data.rates && (data.rates.monthly_breakfast || data.rates.monthly_no_breakfast) ? h('div', null,
            h('h2', null, `Tarifas do servizo (Curso ${data.academic_year || '2026-2027'})`),
            h('p', null, 'Segundo a guía oficial do servizo:'),
            h('ul', null,
              data.rates.monthly_breakfast ? h('li', null, 'Con almorzo: ', h('strong', null, data.rates.monthly_breakfast)) : null,
              data.rates.monthly_no_breakfast ? h('li', null, 'Sen almorzo: ', h('strong', null, data.rates.monthly_no_breakfast)) : null
            )
          ) : null,

          data.registration_url || data.fixed_users_note ? h('div', null,
            h('h2', null, 'Inscrición e funcionamento'),
            data.registration_url ? h('p', null, `Tramitación na web: ${data.registration_url}`) : null,
            data.fixed_users_note ? h('p', null, `Usuarios fixos: ${data.fixed_users_note}`) : null
          ) : null,

          // 3. Comedor Steps
          data.steps && data.steps.length > 0 ? h('div', null,
            h('h2', null, 'PAGO COMEDOR A TRAVÉS DE ATRIGA'),
            data.steps.map((st, idx) => {
              const stepImg = st.image ? getAsset(st.image) : null;
              return h('div', { key: idx, style: { margin: '1rem 0' } },
                st.description ? h('p', null, st.description) : null,
                stepImg ? h('img', { src: stepImg.toString(), alt: st.image_alt || '', style: { maxWidth: '100%', borderRadius: '8px' } }) : null
              );
            })
          ) : null,

          // 4. Inscrición Bank Box
          data.bank_iban ? h('div', { className: 'bank-box', style: { margin: '1.5rem 0' } },
            h('span', { className: 'bank-box__label' }, 'Número de conta (IBAN)'),
            h('div', { className: 'bank-box__value' },
              h('code', { className: 'bank-box__iban' }, data.bank_iban)
            )
          ) : null,
          data.registration_form_url ? h('p', { style: { margin: '1.5rem 0' } },
            h('span', { className: 'btn-action btn-action--primary' }, data.registration_button_label || 'Formulario de inscrición')
          ) : null,

          // 5. Documents list
          data.documents && data.documents.length > 0 ? h('div', null,
            h('h2', null, 'Documentación informativa'),
            data.documents.map((doc, idx) => h('div', { key: idx, className: 'doc-card', style: { margin: '1rem 0' } },
              h('div', { className: 'doc-card__main' },
                h('div', { className: 'doc-card__info' },
                  h('h3', { className: 'doc-card__title' }, doc.title || 'Documento'),
                  doc.description ? h('p', { className: 'doc-card__meta' }, doc.description) : null
                )
              ),
              h('div', { className: 'doc-card__actions' },
                h('span', { className: 'doc-btn doc-btn--primary' }, 'Abrir PDF')
              )
            ))
          ) : null,

          // 6. Consello Escolar
          data.blog_url ? h('p', null,
            h('span', { className: 'btn-action' }, data.blog_label || 'Blog do Consello Escolar')
          ) : null,

          // 7. Bottom flexible sections
          renderBlocks(data.sections, getAsset),

          // 8. Contact
          data.contact_anpa_email || data.contact_email ? h('div', null,
            h('h2', null, 'Contacto e axuda'),
            h('p', null, `Email: ${data.contact_anpa_email || data.contact_email}`)
          ) : null,

          // Markdown body
          this.props.widgetFor ? this.props.widgetFor('body') : null
        )
      );
    }
  });

  // Rexistrar estilos e compoñentes no CMS
  if (window.CMS) {
    CMS.registerPreviewStyle('/css/style.css');
    CMS.registerPreviewTemplate('posts', PostPreview);
    CMS.registerPreviewTemplate('extraescolares', ExtraescolaresPreview);
    CMS.registerPreviewTemplate('pages', PagePreview);
  }
})();
