// Pali Dictionary for word recognition and formatting
const PALI_DICTIONARY = {
    // Core Buddhist concepts
    'dukkha': {
        meaning: 'suffering, unsatisfactoriness',
        category: 'core concept',
        pronunciation: 'dook-kha'
    },
    'nibbana': {
        meaning: 'liberation, enlightenment, the cessation of suffering',
        category: 'core concept',
        aliases: ['nirvana']
    },
    'nirvana': {
        meaning: 'liberation, enlightenment, the cessation of suffering',
        category: 'core concept',
        aliases: ['nibbana']
    },
    'dhamma': {
        meaning: 'teaching, law, truth, phenomenon',
        category: 'core concept',
        aliases: ['dharma']
    },
    'dharma': {
        meaning: 'teaching, law, truth, phenomenon',
        category: 'core concept',
        aliases: ['dhamma']
    },
    'sangha': {
        meaning: 'community of monks/nuns, spiritual community',
        category: 'core concept'
    },
    'buddha': {
        meaning: 'awakened one, enlightened being',
        category: 'core concept'
    },
    'samsara': {
        meaning: 'cycle of rebirth and suffering',
        category: 'core concept',
        aliases: ['saṃsāra']
    },
    'saṃsāra': {
        meaning: 'cycle of rebirth and suffering',
        category: 'core concept',
        aliases: ['samsara']
    },
    'karma': {
        meaning: 'action, deed, law of cause and effect',
        category: 'core concept',
        aliases: ['kamma']
    },
    'kamma': {
        meaning: 'action, deed, law of cause and effect',
        category: 'core concept',
        aliases: ['karma']
    },

    // Meditation and Practice
    'vipassana': {
        meaning: 'insight meditation, clear seeing',
        category: 'meditation'
    },
    'samatha': {
        meaning: 'calm abiding, concentration meditation',
        category: 'meditation'
    },
    'jhana': {
        meaning: 'meditative absorption',
        category: 'meditation',
        aliases: ['dhyana']
    },
    'dhyana': {
        meaning: 'meditative absorption',
        category: 'meditation',
        aliases: ['jhana']
    },
    'mindfulness': {
        meaning: 'awareness, present moment attention',
        category: 'meditation',
        aliases: ['sati']
    },
    'sati': {
        meaning: 'mindfulness, awareness',
        category: 'meditation',
        aliases: ['mindfulness']
    },
    'samadhi': {
        meaning: 'concentration, mental stability',
        category: 'meditation'
    },

    // Wisdom and Understanding
    'panna': {
        meaning: 'wisdom, understanding',
        category: 'wisdom',
        aliases: ['prajna', 'paññā']
    },
    'paññā': {
        meaning: 'wisdom, understanding',
        category: 'wisdom',
        aliases: ['panna', 'prajna']
    },
    'prajna': {
        meaning: 'wisdom, understanding',
        category: 'wisdom',
        aliases: ['panna', 'paññā']
    },
    'bodhi': {
        meaning: 'awakening, enlightenment',
        category: 'wisdom'
    },
    'moksha': {
        meaning: 'liberation, release from samsara',
        category: 'wisdom',
        aliases: ['mokṣa']
    },
    'mokṣa': {
        meaning: 'liberation, release from samsara',
        category: 'wisdom',
        aliases: ['moksha']
    },

    // Philosophical Terms
    'anicca': {
        meaning: 'impermanence, transience',
        category: 'philosophy'
    },
    'anatta': {
        meaning: 'no-self, non-self',
        category: 'philosophy',
        aliases: ['anatman']
    },
    'anatman': {
        meaning: 'no-self, non-self',
        category: 'philosophy',
        aliases: ['anatta']
    },
    'sunyata': {
        meaning: 'emptiness, voidness',
        category: 'philosophy',
        aliases: ['śūnyatā']
    },
    'śūnyatā': {
        meaning: 'emptiness, voidness',
        category: 'philosophy',
        aliases: ['sunyata']
    },

    // Specific Pali Phrases
    'sabbaṃ': {
        meaning: 'all, everything',
        category: 'grammar'
    },
    'saṅkhāraṃ': {
        meaning: 'conditioned things, formations',
        category: 'philosophy'
    },
    'aniccaṃ': {
        meaning: 'impermanent',
        category: 'philosophy'
    },

    // Texts and Literature
    'dhammapada': {
        meaning: 'collection of Buddhist verses',
        category: 'text'
    },
    'vinaya': {
        meaning: 'monastic discipline, rules',
        category: 'text'
    },
    'sutta': {
        meaning: 'discourse, teaching',
        category: 'text',
        aliases: ['sutra']
    },
    'sutra': {
        meaning: 'discourse, teaching',
        category: 'text',
        aliases: ['sutta']
    },
    'abhidhamma': {
        meaning: 'higher teaching, systematic philosophy',
        category: 'text',
        aliases: ['abhidharma']
    },
    'abhidharma': {
        meaning: 'higher teaching, systematic philosophy',
        category: 'text',
        aliases: ['abhidhamma']
    },

    // Ethical Concepts
    'sila': {
        meaning: 'ethical conduct, virtue',
        category: 'ethics',
        aliases: ['śīla']
    },
    'śīla': {
        meaning: 'ethical conduct, virtue',
        category: 'ethics',
        aliases: ['sila']
    },
    'ahimsa': {
        meaning: 'non-violence, non-harm',
        category: 'ethics'
    },
    'metta': {
        meaning: 'loving-kindness, goodwill',
        category: 'ethics'
    },
    'karuna': {
        meaning: 'compassion',
        category: 'ethics',
        aliases: ['karuṇā']
    },
    'karuṇā': {
        meaning: 'compassion',
        category: 'ethics',
        aliases: ['karuna']
    },
    'mudita': {
        meaning: 'sympathetic joy',
        category: 'ethics'
    },
    'upekkha': {
        meaning: 'equanimity, balanced awareness',
        category: 'ethics'
    },

    // Monastic Terms
    'bhikkhu': {
        meaning: 'monk',
        category: 'monastic'
    },
    'bhikkhuni': {
        meaning: 'nun',
        category: 'monastic'
    },
    'samanera': {
        meaning: 'novice monk',
        category: 'monastic'
    },
    'samaneri': {
        meaning: 'novice nun',
        category: 'monastic'
    },

    // Ritual and Practice
    'puja': {
        meaning: 'worship, offering, devotional practice',
        category: 'ritual'
    },
    'mantra': {
        meaning: 'sacred sound, chant',
        category: 'ritual'
    },
    'mudra': {
        meaning: 'hand gesture, seal',
        category: 'ritual'
    },
    'stupa': {
        meaning: 'reliquary monument',
        category: 'architecture'
    },
    'chaitya': {
        meaning: 'prayer hall, shrine',
        category: 'architecture'
    }
};

// Pali text processor class
class PaliProcessor {
    constructor() {
        this.dictionary = PALI_DICTIONARY;
        this.paliWordRegex = this.createPaliWordRegex();
    }

    // Create regex pattern for Pali words
    createPaliWordRegex() {
        const words = Object.keys(this.dictionary);
        // Sort by length (longest first) to match longer words before shorter ones
        words.sort((a, b) => b.length - a.length);
        const pattern = words.map(word => this.escapeRegex(word)).join('|');
        return new RegExp(`\\b(${pattern})\\b`, 'gi');
    }

    // Escape special regex characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Format text with Pali word highlighting
    formatPaliWords(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        return text.replace(this.paliWordRegex, (match) => {
            const lowerMatch = match.toLowerCase();
            const wordInfo = this.dictionary[lowerMatch];
            
            if (wordInfo) {
                // Preserve original case of the match
                return `<span class="pali-word" title="${wordInfo.meaning}" data-category="${wordInfo.category}">${match}</span>`;
            }
            return match;
        });
    }

    // Get word information
    getWordInfo(word) {
        const lowerWord = word.toLowerCase();
        return this.dictionary[lowerWord] || null;
    }

    // Search for words by category
    getWordsByCategory(category) {
        return Object.entries(this.dictionary)
            .filter(([word, info]) => info.category === category)
            .map(([word, info]) => ({ word, ...info }));
    }

    // Get all categories
    getCategories() {
        const categories = new Set();
        Object.values(this.dictionary).forEach(info => {
            categories.add(info.category);
        });
        return Array.from(categories).sort();
    }

    // Add new word to dictionary
    addWord(word, info) {
        if (word && info && info.meaning && info.category) {
            this.dictionary[word.toLowerCase()] = info;
            // Recreate regex to include new word
            this.paliWordRegex = this.createPaliWordRegex();
            return true;
        }
        return false;
    }

    // Remove word from dictionary
    removeWord(word) {
        const lowerWord = word.toLowerCase();
        if (this.dictionary[lowerWord]) {
            delete this.dictionary[lowerWord];
            // Recreate regex
            this.paliWordRegex = this.createPaliWordRegex();
            return true;
        }
        return false;
    }

    // Export dictionary for backup
    exportDictionary() {
        return JSON.stringify(this.dictionary, null, 2);
    }

    // Import dictionary from backup
    importDictionary(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (typeof imported === 'object' && imported !== null) {
                this.dictionary = { ...this.dictionary, ...imported };
                this.paliWordRegex = this.createPaliWordRegex();
                return true;
            }
        } catch (error) {
            console.error('Failed to import dictionary:', error);
        }
        return false;
    }
}

// Create global instance
const paliProcessor = new PaliProcessor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PALI_DICTIONARY, PaliProcessor, paliProcessor };
}
