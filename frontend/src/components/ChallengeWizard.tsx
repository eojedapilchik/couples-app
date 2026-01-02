import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Bolt as SimpleIcon,
  Explore as GuidedIcon,
  AutoAwesome as CustomIcon,
  ExpandMore as ExpandIcon,
  Lightbulb as IdeaIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import type { ChallengeType, RewardType, ProposalCreate } from '../api/types';
import { STRINGS as APP_STRINGS, CURRENCY_NAME } from '../config';

interface ChallengeWizardProps {
  onSubmit: (data: Partial<ProposalCreate>) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
  initialData?: Partial<ProposalCreate>;
  mode?: 'create' | 'edit';
  allowTypeChange?: boolean;
}

// =============================================================================
// STRINGS - Ready for i18n/multi-language support
// All user-facing text is centralized here for easy translation
// =============================================================================
const STRINGS = {
  // Core Principles
  principles: {
    title: 'Principios',
    items: [
      'El consentimiento es parte del juego, no un extra',
      'La mayoria de acciones toman segundos, no minutos',
      'La complejidad aparece solo cuando es necesaria',
      'Las recompensas otorgan derechos, nunca obligaciones',
    ],
  },

  // Challenge type selection
  typeSelection: {
    title: 'Elige el tipo de reto',
    simple: {
      name: 'Simple',
      tag: 'Rapido',
      description: 'Titulo y descripcion. Listo en segundos.',
    },
    guided: {
      name: 'Guiado',
      tag: 'Con intencion',
      description: 'Agrega el por que y un limite claro.',
    },
    custom: {
      name: 'Personalizado',
      tag: 'Completo',
      description: 'Wizard paso a paso para retos especiales.',
    },
  },

  // Examples for each type
  examples: {
    title: 'Ejemplos para inspirarte',
    simple: [
      {
        title: 'Esta noche, yo guio',
        description: 'Hoy tomo el control por un rato y tu solo sigues.',
      },
      {
        title: 'Placer lento',
        description: 'Me concentro solo en darte placer, sin prisas.',
      },
      {
        title: 'Mentalidad de hotel',
        description: 'Por una hora, olvidamos todo y solo nos disfrutamos.',
      },
    ],
    guided: [
      {
        challenge: 'Guio tu cuerpo sin que tu decidas nada.',
        why: 'Me gusta verte relajarte y dejarte llevar.',
        boundary: 'Paramos cuando quieras.',
      },
      {
        challenge: 'Una noche enfocada solo en tu placer.',
        why: 'Me excita verte disfrutar.',
        boundary: 'Sin prisa, sin expectativas.',
      },
      {
        challenge: 'Yo decido cuando y como te desvistes.',
        why: 'Disfruto jugar con la anticipacion.',
        boundary: 'Solo lo que te haga sentir comoda/o.',
      },
    ],
    custom: [
      {
        intention: 'Quiero atarte las manos suavemente y guiarte.',
        why: 'Me excita cuando confias en mi y te dejas llevar.',
        context: 'Habitacion de hotel, unos 30 minutos.',
        boundaries: 'Sin dolor, palabra de seguridad acordada.',
        reward: 'Tu eliges el proximo reto.',
      },
      {
        intention: 'Te llevo cerca del climax varias veces antes de dejarte llegar.',
        why: 'Disfruto controlar el ritmo de tu placer.',
        context: 'Hotel o espacio privado.',
        boundaries: 'Puedes parar cuando quieras.',
        reward: 'Un cupon a tu eleccion.',
      },
    ],
  },

  // Form labels and placeholders
  forms: {
    simple: {
      header: 'Reto Simple',
      titleLabel: 'Titulo del reto',
      titlePlaceholder: 'Ej: Masaje de 30 minutos',
      descriptionLabel: 'Descripcion (opcional)',
      descriptionPlaceholder: 'Describe el reto con mas detalle...',
      venusNote: APP_STRINGS.currency.partnerWillDecide,
    },
    guided: {
      header: 'Reto Guiado',
      titleLabel: 'Titulo corto del reto',
      titlePlaceholder: 'Ej: Noche guiada',
      challengeLabel: 'Cual es el reto?',
      challengePlaceholder: 'Ej: Esta noche yo guio sin que tu decidas nada',
      whyLabel: 'Por que lo propongo? (opcional)',
      whyPlaceholder: 'Me gustaria explorar...',
      boundaryTitle: 'Un limite claro *',
      customBoundaryLabel: 'Escribe tu limite',
      customBoundaryPlaceholder: 'Ej: Solo si ambos estamos de humor',
    },
    custom: {
      header: 'Reto Personalizado',
      steps: ['Intencion', 'Contexto', 'Limites', 'Recompensa', 'Confirmar'],
      step1: {
        title: 'Que estas proponiendo?',
        intentionLabel: 'Titulo del reto',
        intentionPlaceholder: 'Describe el reto...',
        whyLabel: 'Por que es importante para ti? (opcional)',
        whyPlaceholder: 'Quiero explorar esto porque...',
      },
      step2: {
        locationTitle: 'Lugar',
        durationTitle: 'Duracion aproximada',
      },
      step3: {
        title: 'Limites y seguridad *',
        otherLabel: 'Otros limites (opcional)',
        otherPlaceholder: 'Cualquier otro limite importante...',
      },
      step4: {
        title: 'Recompensa (opcional)',
        detailsLabel: 'Detalles de la recompensa',
        detailsPlaceholders: {
          credits: APP_STRINGS.currency.howMany,
          coupon: 'Que tipo de cupon?',
          default: 'Describe...',
        },
      },
      step5: {
        title: 'Resumen del reto',
        whyLabel: 'Por que',
        locationLabel: 'Lugar',
        durationLabel: 'Duracion',
        boundariesLabel: 'Limites',
        rewardLabel: 'Recompensa',
      },
    },
  },

  // Buttons
  buttons: {
    back: 'Atras',
    next: 'Siguiente',
    cancel: 'Cancelar',
    send: 'Enviar Reto',
    other: 'Otro...',
  },
};

// Predefined boundary options
const BOUNDARY_OPTIONS = [
  'Paramos si algo se siente incomodo',
  'Sin dolor',
  'Solo por X minutos',
  'Podemos parar cuando quiera',
  'Usar palabra de seguridad',
];

// Location options
const LOCATION_OPTIONS = [
  { value: 'home', label: 'En casa' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'escape', label: 'Escapada' },
  { value: 'anywhere', label: 'Donde sea' },
];

// Duration options
const DURATION_OPTIONS = [
  { value: '15min', label: '15 min' },
  { value: '30min', label: '30 min' },
  { value: '1h', label: '1 hora' },
  { value: '2h+', label: '2+ horas' },
  { value: 'all_night', label: 'Toda la noche' },
];

// Reward options - use function to access CURRENCY_NAME at runtime
const getRewardOptions = (): { value: RewardType; label: string; description: string }[] => [
  { value: 'none', label: 'Ninguna', description: 'Solo la experiencia' },
  { value: 'credits', label: CURRENCY_NAME, description: APP_STRINGS.currency.earnExtra },
  { value: 'coupon', label: 'Cupon', description: 'Un cupon especial' },
  { value: 'choose_next', label: 'Elegir siguiente', description: 'Derecho a elegir el proximo reto' },
];

export default function ChallengeWizard({
  onSubmit,
  onCancel,
  disabled,
  initialData,
  mode = 'create',
  allowTypeChange = true,
}: ChallengeWizardProps) {
  // Challenge type selection
  const [challengeType, setChallengeType] = useState<ChallengeType | null>(
    initialData?.challenge_type ?? null
  );

  // Simple/Guided common fields
  const [title, setTitle] = useState(initialData?.custom_title || '');
  const [description, setDescription] = useState(initialData?.custom_description || '');

  // Guided fields
  const [whyProposing, setWhyProposing] = useState(initialData?.why_proposing || '');
  const [selectedBoundary, setSelectedBoundary] = useState('');
  const [customBoundary, setCustomBoundary] = useState('');

  // Custom wizard fields
  const [customStep, setCustomStep] = useState(0);
  const [location, setLocation] = useState(initialData?.location || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [selectedBoundaries, setSelectedBoundaries] = useState<string[]>([]);
  const [customBoundaries, setCustomBoundaries] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>(
    (initialData?.reward_type as RewardType) || 'none'
  );
  const [rewardDetails, setRewardDetails] = useState(initialData?.reward_details || '');

  useEffect(() => {
    if (!initialData) return;
    const data = initialData;
    setChallengeType(data.challenge_type ?? null);
    setTitle(data.custom_title || '');
    setDescription(data.custom_description || '');
    setWhyProposing(data.why_proposing || '');

    if (data.boundary) {
      if (BOUNDARY_OPTIONS.includes(data.boundary)) {
        setSelectedBoundary(data.boundary);
        setCustomBoundary('');
      } else {
        setSelectedBoundary('custom');
        setCustomBoundary(data.boundary);
      }
    } else {
      setSelectedBoundary('');
      setCustomBoundary('');
    }

    if (data.boundaries_json) {
      try {
        const parsed = JSON.parse(data.boundaries_json);
        const list = Array.isArray(parsed) ? parsed.filter((b) => typeof b === 'string') : [];
        const selected = list.filter((b) => BOUNDARY_OPTIONS.includes(b));
        const custom = list.filter((b) => !BOUNDARY_OPTIONS.includes(b));
        setSelectedBoundaries(selected);
        setCustomBoundaries(custom.join(', '));
      } catch {
        setSelectedBoundaries([]);
        setCustomBoundaries('');
      }
    } else {
      setSelectedBoundaries([]);
      setCustomBoundaries('');
    }

    setLocation(data.location || '');
    setDuration(data.duration || '');
    setRewardType((data.reward_type as RewardType) || 'none');
    setRewardDetails(data.reward_details || '');
    setCustomStep(0);
  }, [initialData]);

  const handleTypeChange = (_: unknown, type: ChallengeType | null) => {
    if (type) {
      setChallengeType(type);
    }
  };

  const getBoundary = () => {
    if (selectedBoundary === 'custom') {
      return customBoundary;
    }
    return selectedBoundary;
  };

  const getBoundariesJson = () => {
    const boundaries = [...selectedBoundaries];
    if (customBoundaries.trim()) {
      boundaries.push(customBoundaries.trim());
    }
    return JSON.stringify(boundaries);
  };

  const handleSubmit = async () => {
    const data: Partial<ProposalCreate> = {
      custom_title: title,
      custom_description: description || undefined,
    };

    if (mode !== 'edit') {
      data.challenge_type = challengeType || 'simple';
    }

    if (challengeType === 'guided') {
      data.why_proposing = whyProposing || undefined;
      data.boundary = getBoundary();
    }

    if (challengeType === 'custom') {
      data.why_proposing = whyProposing || undefined;
      data.location = location || undefined;
      data.duration = duration || undefined;
      data.boundaries_json = getBoundariesJson();
      data.reward_type = rewardType;
      data.reward_details = rewardDetails || undefined;
    }

    await onSubmit(data);
  };

  const canSubmitSimple = title.trim().length > 0;
  const canSubmitGuided = title.trim().length > 0 && description.trim().length > 0 && getBoundary().length > 0;
  const canSubmitCustom = title.trim().length > 0 && (selectedBoundaries.length > 0 || customBoundaries.trim());

  const handleBoundaryToggle = (boundary: string) => {
    setSelectedBoundaries(prev =>
      prev.includes(boundary)
        ? prev.filter(b => b !== boundary)
        : [...prev, boundary]
    );
  };

  // Type selection screen
  if (!challengeType && allowTypeChange) {
    return (
      <Box sx={{ py: 2 }}>
        {/* Core Principles - Collapsible */}
        <Accordion
          sx={{
            mb: 2,
            bgcolor: 'primary.50',
            '&:before': { display: 'none' },
            borderRadius: 1,
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HeartIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" color="primary">
                {STRINGS.principles.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {STRINGS.principles.items.map((item, i) => (
                <li key={i}>
                  <Typography variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                </li>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          {STRINGS.typeSelection.title}
        </Typography>

        <ToggleButtonGroup
          value={challengeType}
          exclusive
          onChange={handleTypeChange}
          orientation="vertical"
          fullWidth
          sx={{ gap: 1 }}
        >
          <ToggleButton value="simple" sx={{ py: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <SimpleIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">{STRINGS.typeSelection.simple.name}</Typography>
              <Chip label={STRINGS.typeSelection.simple.tag} size="small" color="success" />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
              {STRINGS.typeSelection.simple.description}
            </Typography>
          </ToggleButton>

          <ToggleButton value="guided" sx={{ py: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <GuidedIcon color="secondary" />
              <Typography variant="subtitle1" fontWeight="bold">{STRINGS.typeSelection.guided.name}</Typography>
              <Chip label={STRINGS.typeSelection.guided.tag} size="small" color="secondary" />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
              {STRINGS.typeSelection.guided.description}
            </Typography>
          </ToggleButton>

          <ToggleButton value="custom" sx={{ py: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CustomIcon sx={{ color: 'warning.main' }} />
              <Typography variant="subtitle1" fontWeight="bold">{STRINGS.typeSelection.custom.name}</Typography>
              <Chip label={STRINGS.typeSelection.custom.tag} size="small" color="warning" />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'left' }}>
              {STRINGS.typeSelection.custom.description}
            </Typography>
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>{STRINGS.buttons.cancel}</Button>
        </Box>
      </Box>
    );
  }

  // Simple challenge form
  if (challengeType === 'simple') {
    return (
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SimpleIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary">{STRINGS.forms.simple.header}</Typography>
        </Box>

        <TextField
          label={STRINGS.forms.simple.titleLabel}
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          placeholder={STRINGS.forms.simple.titlePlaceholder}
          autoFocus
        />

        <TextField
          label={STRINGS.forms.simple.descriptionLabel}
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={STRINGS.forms.simple.descriptionPlaceholder}
        />

        {/* Examples - Collapsible */}
        <Accordion
          sx={{
            mt: 2,
            bgcolor: 'grey.50',
            '&:before': { display: 'none' },
            borderRadius: 1,
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IdeaIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {STRINGS.examples.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {STRINGS.examples.simple.map((ex, i) => (
              <Paper
                key={i}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.50' },
                }}
                onClick={() => {
                  setTitle(ex.title);
                  setDescription(ex.description);
                }}
              >
                <Typography variant="subtitle2">{ex.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {ex.description}
                </Typography>
              </Paper>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
              Toca un ejemplo para usarlo
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {STRINGS.forms.simple.venusNote}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => (allowTypeChange ? setChallengeType(null) : onCancel())}>
            {STRINGS.buttons.back}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={disabled || !canSubmitSimple}
          >
            {STRINGS.buttons.send}
          </Button>
        </Box>
      </Box>
    );
  }

  // Guided challenge form
  if (challengeType === 'guided') {
    return (
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <GuidedIcon color="secondary" fontSize="small" />
          <Typography variant="subtitle2" color="secondary">{STRINGS.forms.guided.header}</Typography>
        </Box>

        <TextField
          label={STRINGS.forms.guided.titleLabel}
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          placeholder={STRINGS.forms.guided.titlePlaceholder}
          autoFocus
          inputProps={{ maxLength: 200 }}
        />

        <TextField
          label={STRINGS.forms.guided.challengeLabel}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={4}
          sx={{ mb: 2 }}
          placeholder={STRINGS.forms.guided.challengePlaceholder}
          inputProps={{ maxLength: 2000 }}
        />

        <TextField
          label={STRINGS.forms.guided.whyLabel}
          fullWidth
          multiline
          rows={2}
          value={whyProposing}
          onChange={(e) => setWhyProposing(e.target.value)}
          sx={{ mb: 2 }}
          placeholder={STRINGS.forms.guided.whyPlaceholder}
        />

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
          {STRINGS.forms.guided.boundaryTitle}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {BOUNDARY_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              onClick={() => setSelectedBoundary(opt)}
              color={selectedBoundary === opt ? 'secondary' : 'default'}
              variant={selectedBoundary === opt ? 'filled' : 'outlined'}
            />
          ))}
          <Chip
            label={STRINGS.buttons.other}
            onClick={() => setSelectedBoundary('custom')}
            color={selectedBoundary === 'custom' ? 'secondary' : 'default'}
            variant={selectedBoundary === 'custom' ? 'filled' : 'outlined'}
          />
        </Box>

        {selectedBoundary === 'custom' && (
          <TextField
            label={STRINGS.forms.guided.customBoundaryLabel}
            fullWidth
            value={customBoundary}
            onChange={(e) => setCustomBoundary(e.target.value)}
            sx={{ mt: 1 }}
            placeholder={STRINGS.forms.guided.customBoundaryPlaceholder}
          />
        )}

        {/* Examples - Collapsible */}
        <Accordion
          sx={{
            mt: 2,
            bgcolor: 'grey.50',
            '&:before': { display: 'none' },
            borderRadius: 1,
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IdeaIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {STRINGS.examples.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {STRINGS.examples.guided.map((ex, i) => (
              <Paper
                key={i}
                sx={{
                  p: 1.5,
                  mb: 1,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'secondary.50' },
                }}
                onClick={() => {
                  setTitle(ex.challenge);
                  setDescription(ex.challenge);
                  setWhyProposing(ex.why);
                  setSelectedBoundary('custom');
                  setCustomBoundary(ex.boundary);
                }}
              >
                <Typography variant="subtitle2" color="secondary.dark">{ex.challenge}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Por que: {ex.why}
                </Typography>
                <Chip label={ex.boundary} size="small" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
              </Paper>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
              Toca un ejemplo para usarlo
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => (allowTypeChange ? setChallengeType(null) : onCancel())}>
            {STRINGS.buttons.back}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={disabled || !canSubmitGuided}
          >
            {STRINGS.buttons.send}
          </Button>
        </Box>
      </Box>
    );
  }

  // Custom challenge wizard
  if (challengeType === 'custom') {
    const customStepsLabels = STRINGS.forms.custom.steps;

    return (
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CustomIcon sx={{ color: 'warning.main' }} fontSize="small" />
          <Typography variant="subtitle2" color="warning.main">{STRINGS.forms.custom.header}</Typography>
        </Box>

        <Stepper activeStep={customStep} alternativeLabel sx={{ mb: 3 }}>
          {customStepsLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Intention */}
        {customStep === 0 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step1.title}
            </Typography>
            <TextField
              label={STRINGS.forms.custom.step1.intentionLabel}
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
              placeholder={STRINGS.forms.custom.step1.intentionPlaceholder}
              autoFocus
            />
            <TextField
              label={STRINGS.forms.custom.step1.whyLabel}
              fullWidth
              multiline
              rows={2}
              value={whyProposing}
              onChange={(e) => setWhyProposing(e.target.value)}
              placeholder={STRINGS.forms.custom.step1.whyPlaceholder}
            />

            {/* Examples - Collapsible */}
            <Accordion
              sx={{
                mt: 2,
                bgcolor: 'grey.50',
                '&:before': { display: 'none' },
                borderRadius: 1,
              }}
              defaultExpanded={false}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IdeaIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {STRINGS.examples.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {STRINGS.examples.custom.map((ex, i) => (
                  <Paper
                    key={i}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'warning.50' },
                    }}
                    onClick={() => {
                      setTitle(ex.intention);
                      setWhyProposing(ex.why);
                    }}
                  >
                    <Typography variant="subtitle2" color="warning.dark">{ex.intention}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Por que: {ex.why}
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Contexto: {ex.context} | Limites: {ex.boundaries}
                    </Typography>
                    {ex.reward !== 'Ninguna' && (
                      <Chip label={`Recompensa: ${ex.reward}`} size="small" sx={{ mt: 0.5, fontSize: '0.6rem' }} />
                    )}
                  </Paper>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                  Toca un ejemplo para usarlo como base
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Step 2: Context */}
        {customStep === 1 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step2.locationTitle}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {LOCATION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  onClick={() => setLocation(opt.value)}
                  color={location === opt.value ? 'warning' : 'default'}
                  variant={location === opt.value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step2.durationTitle}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DURATION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  onClick={() => setDuration(opt.value)}
                  color={duration === opt.value ? 'warning' : 'default'}
                  variant={duration === opt.value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Step 3: Boundaries */}
        {customStep === 2 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step3.title}
            </Typography>
            <FormGroup>
              {BOUNDARY_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      checked={selectedBoundaries.includes(opt)}
                      onChange={() => handleBoundaryToggle(opt)}
                    />
                  }
                  label={opt}
                />
              ))}
            </FormGroup>
            <TextField
              label={STRINGS.forms.custom.step3.otherLabel}
              fullWidth
              multiline
              rows={2}
              value={customBoundaries}
              onChange={(e) => setCustomBoundaries(e.target.value)}
              sx={{ mt: 2 }}
              placeholder={STRINGS.forms.custom.step3.otherPlaceholder}
            />
          </Box>
        )}

        {/* Step 4: Reward */}
        {customStep === 3 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step4.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {getRewardOptions().map((opt) => (
                <Paper
                  key={opt.value}
                  elevation={rewardType === opt.value ? 3 : 0}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: rewardType === opt.value ? 'warning.main' : 'divider',
                    bgcolor: rewardType === opt.value ? 'warning.light' : 'background.paper',
                  }}
                  onClick={() => setRewardType(opt.value)}
                >
                  <Typography variant="subtitle2">{opt.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                </Paper>
              ))}
            </Box>
            {rewardType !== 'none' && (
              <TextField
                label={STRINGS.forms.custom.step4.detailsLabel}
                fullWidth
                value={rewardDetails}
                onChange={(e) => setRewardDetails(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={
                  rewardType === 'credits' ? STRINGS.forms.custom.step4.detailsPlaceholders.credits :
                  rewardType === 'coupon' ? STRINGS.forms.custom.step4.detailsPlaceholders.coupon :
                  STRINGS.forms.custom.step4.detailsPlaceholders.default
                }
              />
            )}
          </Box>
        )}

        {/* Step 5: Confirmation */}
        {customStep === 4 && (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
              {STRINGS.forms.custom.step5.title}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {title}
              </Typography>
              {whyProposing && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {STRINGS.forms.custom.step5.whyLabel}: {whyProposing}
                </Typography>
              )}
              {location && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {STRINGS.forms.custom.step5.locationLabel}: {LOCATION_OPTIONS.find(o => o.value === location)?.label}
                </Typography>
              )}
              {duration && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {STRINGS.forms.custom.step5.durationLabel}: {DURATION_OPTIONS.find(o => o.value === duration)?.label}
                </Typography>
              )}
              <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                {STRINGS.forms.custom.step5.boundariesLabel}:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {selectedBoundaries.map((b, i) => (
                  <li key={i}><Typography variant="body2">{b}</Typography></li>
                ))}
                {customBoundaries && (
                  <li><Typography variant="body2">{customBoundaries}</Typography></li>
                )}
              </Box>
              {rewardType !== 'none' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {STRINGS.forms.custom.step5.rewardLabel}: {getRewardOptions().find(r => r.value === rewardType)?.label}
                  {rewardDetails && ` - ${rewardDetails}`}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => {
            if (customStep === 0) {
              if (allowTypeChange) {
                setChallengeType(null);
              } else {
                onCancel();
              }
            } else {
              setCustomStep(customStep - 1);
            }
          }}>
            {STRINGS.buttons.back}
          </Button>

          {customStep < customStepsLabels.length - 1 ? (
            <Button
              variant="contained"
              color="warning"
              onClick={() => setCustomStep(customStep + 1)}
              disabled={customStep === 0 && !title.trim()}
            >
              {STRINGS.buttons.next}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="warning"
              onClick={handleSubmit}
              disabled={disabled || !canSubmitCustom}
            >
              {STRINGS.buttons.send}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return null;
}
