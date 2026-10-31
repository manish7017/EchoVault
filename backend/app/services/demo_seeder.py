import os
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.models.memory import Collection, Memory, Tag, MemoryEntity, MemoryEmbedding, ProcessingLog
from app.models.ghost_story import GhostStory
from app.services.ai_adapter import embedding_adapter
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)

SAMPLE_COLLECTIONS = [
    {
        "name": "The Blackwood Manor Records (1988–1994)",
        "description": "Fictional archival records discovered in the locked oak armoire of Blackwood Manor.",
        "icon": "castle",
        "color": "#D6A65C"
    },
    {
        "name": "Lighthouse Bay Chronicles (2004–2018)",
        "description": "Fictional coastal recollections, storm logs, and analog photographs from the forgotten North Pier.",
        "icon": "waves",
        "color": "#5E81AC"
    },
    {
        "name": "Whispering Pines Expeditions (1973)",
        "description": "Fictional field notes, hand-drawn cartography, and diary entries from the 1973 forest survey.",
        "icon": "compass",
        "color": "#A3BE8C"
    }
]

SAMPLE_MEMORIES = [
    {
        "title": "The Brass Key in the Attic Floorboard",
        "memory_type": "photo",
        "recorded_date": "1988-10-31",
        "recorded_year": 1988,
        "recorded_month": 10,
        "location": "Blackwood Manor Attic, Hollow Creek",
        "description": "Found wrapped in oilcloth beneath the 4th pine floorboard. Heavy brass, notched with three roman numerals: VII - III - I.",
        "extracted_text": (
            "A vintage sepia photograph showing a tarnished antique brass key resting upon dusty pine floorboards. "
            "Beside it lies an unopened leather-bound journal tied with faded velvet ribbon. "
            "Inscribed on the key's bow is the word 'MEMORIA'. The lighting is dim autumn twilight filtering through an arched attic gable window."
        ),
        "ai_summary": (
            "An enigmatic photograph from Halloween 1988 documenting an ornate brass key hidden beneath the attic floorboards of Blackwood Manor. "
            "The key is marked with Roman numerals and the Latin inscription 'MEMORIA'."
        ),
        "collection_name": "The Blackwood Manor Records (1988–1994)",
        "tags": ["relic", "brass-key", "halloween-1988", "attic", "mystery"],
        "entities": [
            ("person", "Arthur Blackwood"),
            ("location", "Blackwood Manor Attic"),
            ("date", "October 31, 1988"),
            ("topic", "Hidden heirlooms"),
            ("topic", "Secret locks")
        ]
    },
    {
        "title": "Cassette Reel #4: The Rain Against the Study Glass",
        "memory_type": "audio",
        "recorded_date": "1994-12-14",
        "recorded_year": 1994,
        "recorded_month": 12,
        "location": "The East Study, Blackwood Manor",
        "description": "Magnetic tape recorded during the torrential freeze of December 1994. You can hear the grandfather clock chiming 3:00 AM.",
        "extracted_text": (
            "[00:00:02] (Sound of steady rain and crackling fireplace embers)\n"
            "[00:00:15] Arthur Blackwood: 'Is this microphone recording? Good. It is December 14th. The snow has turned to heavy rain against the glass.\n"
            "[00:00:28] If anyone finds this tape after the winter thaw... understand that Evelyn did not simply walk away into the forest.\n"
            "[00:00:44] She heard the melody from the dried well behind the garden wall. Every evening at dusk, three rising notes.\n"
            "[00:01:02] I locked the attic stairs tonight. Whatever echoes inside this house... it is not human grief anymore.'"
        ),
        "ai_summary": (
            "An eerie audio recording from December 1994 where Arthur Blackwood speaks in hushed tones about Evelyn's disappearance into the forest. "
            "He describes hearing recurring musical notes from the dried garden well and declares that he has locked the attic stairs."
        ),
        "collection_name": "The Blackwood Manor Records (1988–1994)",
        "tags": ["audio-recording", "cassette", "rain", "winter-1994", "disappearance"],
        "entities": [
            ("person", "Arthur Blackwood"),
            ("person", "Evelyn Vance"),
            ("location", "The East Study"),
            ("location", "The Dried Well"),
            ("date", "December 14, 1994"),
            ("topic", "Cassette recordings"),
            ("topic", "Eerie melodies")
        ]
    },
    {
        "title": "The Fog Over North Pier Lighthouse",
        "memory_type": "photo",
        "recorded_date": "2004-11-03",
        "recorded_year": 2004,
        "recorded_month": 11,
        "location": "North Pier, Lighthouse Bay",
        "description": "Black and white film captured on an old Yashica camera during the dense fog advisory of November 2004.",
        "extracted_text": (
            "A medium format black-and-white photograph depicting a lonely granite lighthouse enveloped in thick coastal fog. "
            "The wooden pier planks are slick with saltwater spray. At the far edge of the wooden walkway, "
            "a solitary silhouette stands looking out toward the dark horizon, clutching a lantern."
        ),
        "ai_summary": (
            "Atmospheric monochrome photograph of North Pier Lighthouse during the November 2004 sea fog. "
            "A solitary figure with a lantern stands at the edge of the pier facing the ocean mist."
        ),
        "collection_name": "Lighthouse Bay Chronicles (2004–2018)",
        "tags": ["lighthouse", "fog", "analog-photo", "coastal", "loneliness"],
        "entities": [
            ("person", "Dr. Alistair Finch"),
            ("location", "North Pier"),
            ("location", "Lighthouse Bay"),
            ("date", "November 2004"),
            ("topic", "Coastal fog"),
            ("topic", "Analog photography")
        ]
    },
    {
        "title": "Field Survey Notebook: The Forgotten Well of Whispering Pines",
        "memory_type": "document",
        "recorded_date": "1973-07-22",
        "recorded_year": 1973,
        "recorded_month": 7,
        "location": "Quadrant 9, Whispering Pines",
        "description": "Scanned pages of Dr. Alistair Finch's botanical survey notebook detailing an unmapped circular stone structure deep in the pines.",
        "extracted_text": (
            "July 22, 1973. Field Station Beta.\n"
            "Compass bearings continue to drift 12 degrees magnetic north when approaching the granite clearing in Quadrant 9.\n"
            "Here we uncovered a circular drystone well, estimated 18th century masonry. No water at 40 meters depth.\n"
            "Remarkable acoustic property: any whisper uttered into the rim returns with a four-second delay, subtly pitch-shifted downward.\n"
            "Field assistant Marcus refused to stay near the site past sunset, claiming he heard his childhood name whispered back in his mother's voice."
        ),
        "ai_summary": (
            "1973 survey log of an ancient stone well in Whispering Pines showing magnetic anomalies and an unexplained acoustic echo phenomenon "
            "that pitch-shifts whispered voices."
        ),
        "collection_name": "Whispering Pines Expeditions (1973)",
        "tags": ["field-notes", "survey", "acoustic-anomaly", "whispering-well", "1970s"],
        "entities": [
            ("person", "Dr. Alistair Finch"),
            ("person", "Marcus Thorne"),
            ("location", "Whispering Pines"),
            ("location", "Quadrant 9"),
            ("date", "July 22, 1973"),
            ("topic", "Acoustic anomalies"),
            ("topic", "Expedition journals")
        ]
    },
    {
        "title": "Recollection: The Night the Clock Stood Still at 3:14 AM",
        "memory_type": "story",
        "recorded_date": "2018-12-31",
        "recorded_year": 2018,
        "recorded_month": 12,
        "location": "Old Town Harbor Cottage",
        "description": "A written memory of New Year's Eve 2018 when the power failed and all battery clocks stopped simultaneously.",
        "extracted_text": (
            "On December 31, 2018, the winter blizzard severed the coastal electrical lines at 3:00 AM.\n"
            "We lit tallow candles and sat around the wood stove. At exactly 3:14 AM, the mechanical pendulum in the parlor clock gave a singular shudder and froze.\n"
            "What struck me was the silence that followed. Not the ordinary quiet of a winter night, but a complete absence of sound, as if the room had slipped outside the flow of hours.\n"
            "When the dawn finally broke at 7:00 AM, the pendulum resumed without being touched."
        ),
        "ai_summary": (
            "A personal narrative recollecting New Year's Eve 2018 in an Old Town cottage when a severe storm stopped all clocks at 3:14 AM, "
            "plunging the house into an uncanny silence before resuming at dawn."
        ),
        "collection_name": "Lighthouse Bay Chronicles (2004–2018)",
        "tags": ["personal-story", "blizzard", "stopped-clock", "winter-2018", "solitude"],
        "entities": [
            ("location", "Old Town Harbor Cottage"),
            ("date", "December 31, 2018"),
            ("topic", "Time distortion"),
            ("topic", "Winter blizzards")
        ]
    }
]

SAMPLE_STORY = {
    "title": "The Resonances of Quadrant Nine",
    "narrative_style": "haunted_gothic",
    "story_text": (
        "They say an abandoned house never truly forgets the weight of the footsteps that once crossed its thresholds. "
        "In the autumn of 1988, beneath the pine boards of Blackwood Manor, Arthur Blackwood hid a brass key stamped with the word MEMORIA. "
        "Six years later, amidst the freezing rains of December 1994, his recorded voice trembled into the cassette ribbon, speaking of Evelyn's departure toward the dried garden well.\n\n"
        "Farther north, past the granite spine of Whispering Pines where Dr. Finch documented the acoustic anomalies of 1973, "
        "the same three rising notes were heard again. A whisper sent into the stone does not dissipate; it circles, gathering the resonance of fifty passing years. "
        "And on the fog-slicked wooden planks of North Pier, where solitary lanterns still sway against the salt spray, "
        "the memories do not belong to the living or the dead. They belong to the archive, waiting in quiet amber darkness for someone to turn the key."
    ),
    "disclaimer": "Fictional interpretation: EchoVault generated this story as a fictional narrative inspired by archive artifacts, not an actual communication from deceased persons.",
    "is_sample": True
}

class DemoSeeder:
    """Seeds rich fictional sample archive memories for instant evaluation."""

    async def seed_sample_data_if_empty(self, db: Session, force: bool = False):
        existing_count = db.query(Memory).count()
        if existing_count > 0 and not force:
            logger.info(f"Database already contains {existing_count} memories. Skipping sample seed.")
            return

        logger.info("Seeding fictional demo memories into EchoVault...")

        # 1. Create collections
        collections_map = {}
        for cdata in SAMPLE_COLLECTIONS:
            col = db.query(Collection).filter(Collection.name == cdata["name"]).first()
            if not col:
                col = Collection(
                    name=cdata["name"],
                    description=cdata["description"],
                    icon=cdata["icon"],
                    color=cdata["color"]
                )
                db.add(col)
                db.flush()
            collections_map[cdata["name"]] = col

        # 2. Create memories
        created_memory_ids = []
        for mdata in SAMPLE_MEMORIES:
            col = collections_map.get(mdata["collection_name"])
            
            memory = Memory(
                title=mdata["title"],
                description=mdata["description"],
                memory_type=mdata["memory_type"],
                recorded_date=mdata["recorded_date"],
                recorded_year=mdata["recorded_year"],
                recorded_month=mdata["recorded_month"],
                location=mdata["location"],
                extracted_text=mdata["extracted_text"],
                ai_summary=mdata["ai_summary"],
                processing_status="completed",
                is_sample=True,
                collection_id=col.id if col else None,
                access_count=1,
                last_accessed_at=datetime.now(timezone.utc)
            )
            db.add(memory)
            db.flush()
            created_memory_ids.append(memory.id)

            # Add tags
            for tname in mdata["tags"]:
                tag = db.query(Tag).filter(Tag.name == tname).first()
                if not tag:
                    tag = Tag(name=tname)
                    db.add(tag)
                    db.flush()
                memory.tags.append(tag)

            # Add entities
            for etype, evalue in mdata["entities"]:
                db.add(MemoryEntity(
                    memory_id=memory.id,
                    entity_type=etype,
                    entity_value=evalue
                ))

            # Add processing logs
            db.add(ProcessingLog(
                memory_id=memory.id,
                step_name="archival_ingestion",
                status="completed",
                message=f"Sample memory verified and ingested into '{mdata['collection_name']}'."
            ))

            # Generate vector embeddings
            full_text = f"Title: {mdata['title']}\nDate: {mdata['recorded_date']}\nLocation: {mdata['location']}\nContent: {mdata['extracted_text']}"
            try:
                emb = await embedding_adapter.embed_text(full_text)
                vector_store.save_embedding(
                    db=db,
                    memory_id=memory.id,
                    chunk_index=0,
                    chunk_text=full_text,
                    embedding=emb,
                    model_name=settings.OLLAMA_EMBED_MODEL
                )
            except Exception as e:
                logger.warning(f"Failed to generate embedding for sample memory '{mdata['title']}': {e}")

        # 3. Create Sample Ghost Story
        existing_story = db.query(GhostStory).filter(GhostStory.title == SAMPLE_STORY["title"]).first()
        if not existing_story:
            story = GhostStory(
                title=SAMPLE_STORY["title"],
                narrative_style=SAMPLE_STORY["narrative_style"],
                story_text=SAMPLE_STORY["story_text"],
                source_memory_ids=created_memory_ids[:3],
                disclaimer=SAMPLE_STORY["disclaimer"],
                is_sample=True
            )
            db.add(story)

        db.commit()
        logger.info(f"Successfully seeded {len(created_memory_ids)} sample memories into EchoVault.")

demo_seeder = DemoSeeder()
