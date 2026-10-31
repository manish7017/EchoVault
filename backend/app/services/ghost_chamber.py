import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.memory import Memory
from app.models.ghost_story import GhostStory
from app.schemas.ghost import GhostStoryCreateRequest, GhostStoryResponse
from app.services.ai_adapter import llm_adapter
from app.services.tts_service import tts_service

logger = logging.getLogger(__name__)

STYLE_PROMPTS = {
    "haunted_gothic": (
        "You are a master of atmospheric gothic literature (in the vein of Shirley Jackson, Edgar Allan Poe, and M.R. James). "
        "Craft a haunting, eerie, poetic ghost story woven strictly from the details, places, dates, and people found in the chosen memories. "
        "Emphasize silence, flickering shadows, old photographs, forgotten dust, and the weight of passing time. "
        "Do not invent sensational gore; cultivate psychological dread, quiet beauty, and melancholy nostalgia."
    ),
    "mysterious_noir": (
        "You are an investigative archivist in a dimly lit rainy city, reviewing cold archival artifacts. "
        "Piece together the selected memories as an unsolved mystery or eerie case study. "
        "Examine the timestamps, locations, and missing details like puzzle pieces that refuse to fit neatly."
    ),
    "first_person_echo": (
        "Speak in the first-person voice ('I') of the archive itself or one of the silent physical objects recorded in these memories "
        "(e.g., an unplayed cassette ribbon, a faded silver gelatin photograph, the dark wood of an attic floorboard). "
        "Express how it felt to witness the people, voices, and moments documented in these records, watching them fade into memory."
    ),
    "chronological_reconstruction": (
        "Construct an atmospheric chronological timeline narrative. "
        "Assemble the memories in chronological order, narrating what happened at each step, and highlighting the strange pauses, "
        "unspoken gaps, and echoes between the events."
    )
}

DISCLAIMER_TEXT = (
    "Fictional interpretation: EchoVault generated this story as a fictional narrative inspired by archive artifacts, "
    "not an actual communication from deceased persons."
)

class GhostChamberService:
    """Atmospheric Halloween storytelling engine."""

    async def generate_story(
        self,
        db: Session,
        req: GhostStoryCreateRequest
    ) -> GhostStoryResponse:
        # 1. Fetch selected memories
        memories = db.query(Memory).filter(Memory.id.in_(req.memory_ids)).all()
        if not memories:
            raise ValueError("No valid memories selected for story generation.")

        # Build context from memories
        memory_contexts = []
        for mem in memories:
            context_part = f"Memory: '{mem.title}'\n"
            context_part += f"- Type: {mem.memory_type}\n"
            if mem.recorded_date:
                context_part += f"- Date: {mem.recorded_date}\n"
            if mem.location:
                context_part += f"- Location: {mem.location}\n"
            if mem.description:
                context_part += f"- Notes: {mem.description}\n"
            if mem.extracted_text:
                context_part += f"- Content/Transcript: {mem.extracted_text[:1200]}\n"
            memory_contexts.append(context_part)

        all_memories_text = "\n---\n".join(memory_contexts)

        # Style instruction
        system_instruction = STYLE_PROMPTS.get(req.narrative_style, STYLE_PROMPTS["haunted_gothic"])

        story_prompt = (
            f"Here are the genuine archived records to draw inspiration from:\n\n"
            f"{all_memories_text}\n\n"
        )
        if req.custom_prompt:
            story_prompt += f"Specific storytelling direction: {req.custom_prompt}\n\n"
        story_prompt += (
            "Write a complete atmospheric story (approx 350-600 words) using these exact memories. "
            "Give the story an evocative, poetic title on the first line formatted as '# Title'."
        )

        raw_story = await llm_adapter.generate(
            prompt=story_prompt,
            system=system_instruction,
            temperature=0.8
        )

        # Extract title if present
        title = req.title
        lines = [line.strip() for line in raw_story.split("\n") if line.strip()]
        if not title:
            if lines and lines[0].startswith("#"):
                title = lines[0].replace("#", "").strip()
            else:
                title = f"The Echoes of {memories[0].title}"

        # Clean text
        story_text = raw_story.strip()

        # Optional audio narration
        audio_url = None
        if req.generate_narration:
            audio_url = await tts_service.generate_narration(story_text)

        # Save story to database
        story_record = GhostStory(
            title=title,
            narrative_style=req.narrative_style,
            prompt=req.custom_prompt,
            story_text=story_text,
            audio_path=audio_url,
            source_memory_ids=req.memory_ids,
            disclaimer=DISCLAIMER_TEXT,
            is_sample=False
        )
        db.add(story_record)
        db.commit()

        return GhostStoryResponse(
            id=story_record.id,
            title=story_record.title,
            narrative_style=story_record.narrative_style,
            prompt=story_record.prompt,
            story_text=story_record.story_text,
            audio_path=story_record.audio_path,
            source_memory_ids=story_record.source_memory_ids,
            disclaimer=DISCLAIMER_TEXT,
            is_sample=story_record.is_sample,
            created_at=story_record.created_at
        )

ghost_chamber_service = GhostChamberService()
