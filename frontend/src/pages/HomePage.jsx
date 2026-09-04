import NotesNotFound from "../components/NotesNotFound";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import NoteCard from "../components/NoteCard";
import api from "../lib/axios";
import { toast } from "react-hot-toast";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get("/notes");
        setNotes(res.data);
      } catch (error) {
        console.log(error);
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error("Error fetching notes. Please try again later.");
          //console.error("Error fetching notes:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      {isRateLimited ? (
        <RateLimitedUI />
      ) : isLoading ? (
        <div className="p-4">
          Loading Notes...
          {notes.length === 0 && !isRateLimited && <NotesNotFound />}
        </div>
      ) : (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Notes</h2>
          {notes.length === 0 ? (
            <NotesNotFound />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div key={note._id} className="border rounded p-4 shadow bg-white dark:bg-gray-800">
                  <NoteCard key={note._id} note={note} setNotes={setNotes} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
