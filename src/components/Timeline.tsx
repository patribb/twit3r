import Image from "next/image";
import type { RouterInputs, RouterOutputs } from "../utils/trpc";
import { trpc } from "../utils/trpc";
import { CreateTweet } from "./CreateTweet";
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocal from 'dayjs/plugin/updateLocale'
import { useEffect, useState } from "react";
import {AiFillHeart} from 'react-icons/ai'
import type { InfiniteData, QueryClient} from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const LIMIT = 10;

dayjs.extend(relativeTime)
dayjs.extend(updateLocal)

dayjs.updateLocale('es', {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "1m",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1M",
    MM: "%dM",
    y: "1y",
    yy: "%dy",
  },
});

const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0)

  const handleScroll = () => {
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const scrolled = (winScroll / height) * 100;
    setScrollPosition(scrolled);
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, {passive: true})
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, []);

  return scrollPosition;
  
}

const updateCache = ({client, variables, data, action, input}: {client: QueryClient;
  input: RouterInputs['tweet']['timeline'];
   variables: {
tweetId: string
}; data: {
  userId: string
}; action: 'like' | 'unlike'}) => {
  client.setQueryData([
    ['tweet', 'timeline'],
    {
      input,
      type: 'infinite'
    }
  ], (oldData) => {
     const newData = oldData as InfiniteData<RouterOutputs['tweet']['timeline']>
     const value = action === 'like'? 1 : -1

     const newTweets = newData.pages.map((page) => {
      return {
        tweets: page.tweets.map((tweet) => {
          if(tweet.id === variables.tweetId) {
            return {
              ...tweet,
              likes: action === 'like' ? [data.userId] : [],
              _count: {
                likes: tweet._count.likes + value,
              }
            }
          }
          return tweet;
        }),
      }
     })
     return {
     ...newData,
      pages: newTweets,
     }
  })
}

const Tweet = ({
  tweet,
  client,
  input
}: {
  tweet: RouterOutputs["tweet"]["timeline"]["tweets"][number];
  client: QueryClient;
  input: RouterInputs['tweet']['timeline'];
}) => {
  const likeMutation = trpc.tweet.like.useMutation({
    onSuccess: (data, variables) => {
      updateCache({
        client, data, variables, input, action: 'like'
      })
    }
  }).mutateAsync;
  const unlikeMutation = trpc.tweet.unlike.useMutation({
    onSuccess: (data, variables) => {
      updateCache({
        client, data, variables, input, action: 'unlike'
      })
    }
  }).mutateAsync;
  const hasliked = tweet.likes.length > 0
  return (
    <div className="mb-4 border-b-2 border-sky-100">
      <div className="flex p-2">
        {tweet.author.image && (
          <Image
            src={tweet.author.image}
            alt={`${tweet.author.name} profile picture`}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div className="ml-2">
        <div className="flex items-center">
          <p className="text-gray-600 text-sm font-black mr-2"><Link href={`/${tweet.author.name}`}>@{tweet.author.name}</Link></p>
          <p className="text-gray-400 text-xs"> - {dayjs(tweet.createdAt).fromNow()}</p>
        </div>
        <div className="text-gray-500">{tweet.text}</div>
        </div>
      </div>
      <div className="cursor-pointer items-center flex mt-4 p-2"><AiFillHeart color={hasliked ? 'red' : 'gray'}  size={'1rem'} onClick={() => {
        if(hasliked) {
          unlikeMutation({
            tweetId: tweet.id
          })
          return;
        }
        likeMutation({
          tweetId: tweet.id
        })
      }} />
      <span className="text-xs font-light text-gray-400">{tweet._count.likes}</span>
      </div>
    </div>
  );
};

export const Timeline = ({where = {}}: {where: RouterInputs['tweet']['timeline']['where']}) => {
  const scrollPosition = useScrollPosition();
  
  const { data, hasNextPage, fetchNextPage, isFetching } = trpc.tweet.timeline.useInfiniteQuery({
    limit: LIMIT,
    where
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,  
  });
  const client = useQueryClient()
  const tweets = data?.pages.flatMap((page) => page.tweets) ?? [];

  useEffect(() => {
    if(scrollPosition > 90 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetching, scrollPosition]);
    
  return (
    <div>
      <CreateTweet />
      <div className="border-l-2 border-sky-100 border-r-2 border-t-2">
        {tweets.map((tweet) => (
          <Tweet tweet={tweet} key={tweet.id} client={client} input={{
             where,
             limit: LIMIT,
          }} />
        ))}
        {!hasNextPage && <p className="text-sm text-gray-500 font-light text-center">No more tweets for load....</p>}
      </div>
    </div>
  );
};
