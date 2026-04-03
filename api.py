from fastapi.responses import StreamingResponse

@app.post("/chat")
async def chat(req: ChatRequest):

    messages = [
        {"role": "system", "content": "You are a helpful assistant."}
    ]

    messages.append({"role": "user", "content": req.message})

    def generate():
        try:
            stream = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                stream=True
            )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield "⚠️ Error"

    return StreamingResponse(generate(), media_type="text/plain")
