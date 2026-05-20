/** Detecta URLs de stock genéricas que deben sustituirse por media del repo */
export function isStaleMediaUrl(url) {
  if (!url) return true;
  return /unsplash\.com|pexels\.com|videos\.pexels/i.test(url);
}

export function mergeServicesWithDefaults(data, defaults) {
  if (!data?.services || !defaults?.services) return data;

  const byId = Object.fromEntries(defaults.services.map((s) => [s.id, s]));
  return {
    ...data,
    services: data.services.map((s) => {
      const d = byId[s.id];
      if (!d) return s;
      return {
        ...s,
        navLabel: s.navLabel || d.navLabel || s.title,
        image: isStaleMediaUrl(s.image) ? d.image : (s.image || d.image || ''),
      };
    }),
  };
}

export function mergeProjectsWithDefaults(data, defaults) {
  if (!defaults?.projects) return data;

  const byId = Object.fromEntries(defaults.projects.map((p) => [p.id, p]));
  const existingIds = new Set((data.projects || []).map((p) => p.id));

  const projects = (data.projects || []).map((p) => {
    const d = byId[p.id];
    if (!d) return p;
    return {
      ...p,
      image: isStaleMediaUrl(p.image) ? d.image : p.image,
    };
  });

  for (const d of defaults.projects) {
    if (!existingIds.has(d.id)) projects.push(d);
  }

  return { ...data, projects };
}

export function mergeHomeWithDefaults(data, defaults) {
  if (!defaults) return data;

  const merged = { ...data };

  if (defaults.hero && merged.hero) {
    merged.hero = { ...merged.hero };
    if (isStaleMediaUrl(merged.hero.videoUrl) && defaults.hero.videoUrl) {
      merged.hero.videoUrl = defaults.hero.videoUrl;
    }
    if (isStaleMediaUrl(merged.hero.posterUrl) && defaults.hero.posterUrl) {
      merged.hero.posterUrl = defaults.hero.posterUrl;
    }
  }

  if (defaults.about && merged.about) {
    merged.about = { ...merged.about };
    if (isStaleMediaUrl(merged.about.image) && defaults.about.image) {
      merged.about.image = defaults.about.image;
      merged.about.imageAlt = defaults.about.imageAlt || merged.about.imageAlt;
    }
  }

  if (defaults.cta && merged.cta) {
    merged.cta = { ...merged.cta };
    if (isStaleMediaUrl(merged.cta.backgroundImage) && defaults.cta.backgroundImage) {
      merged.cta.backgroundImage = defaults.cta.backgroundImage;
    }
  }

  return merged;
}

export function mergeNosotrosWithDefaults(data, defaults) {
  if (!defaults?.intro || !data?.intro) return data;

  const intro = { ...data.intro };
  if (isStaleMediaUrl(intro.image) && defaults.intro.image) {
    intro.image = defaults.intro.image;
    intro.imageAlt = defaults.intro.imageAlt || intro.imageAlt;
  }

  return { ...data, intro };
}

export function mergeContentWithDefaults(name, data, defaults) {
  if (!defaults) return data;

  switch (name) {
    case 'services':
      return mergeServicesWithDefaults(data, defaults);
    case 'projects':
      return mergeProjectsWithDefaults(data, defaults);
    case 'home':
      return mergeHomeWithDefaults(data, defaults);
    case 'nosotros':
      return mergeNosotrosWithDefaults(data, defaults);
    default:
      return data;
  }
}

export function needsContentMerge(name, data) {
  switch (name) {
    case 'services':
      return data?.services?.some((s) => isStaleMediaUrl(s.image));
    case 'projects':
      return data?.projects?.some((p) => isStaleMediaUrl(p.image));
    case 'home':
      return (
        isStaleMediaUrl(data?.hero?.posterUrl)
        || isStaleMediaUrl(data?.hero?.videoUrl)
        || isStaleMediaUrl(data?.about?.image)
        || isStaleMediaUrl(data?.cta?.backgroundImage)
      );
    case 'nosotros':
      return isStaleMediaUrl(data?.intro?.image);
    default:
      return false;
  }
}
