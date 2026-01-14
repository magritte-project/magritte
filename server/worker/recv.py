import asyncio
from contextlib import asynccontextmanager
from multiprocessing.connection import Connection


@asynccontextmanager
async def recv(connection: Connection):
    """
    Receive data from the given pipe connection
    without blocking the event loop.

    :param connection: The pipe connection to receive data from.
    :yield: The received data.
    """
    loop = asyncio.get_event_loop()
    ready = asyncio.Event()
    loop.add_reader(connection.fileno(), ready.set)
    try:
        while not connection.closed:
            await ready.wait()
            ready.clear()
            yield connection.recv()
    finally:
        loop.remove_reader(connection.fileno())
