import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook for managing Supabase real-time subscriptions
 */
export function useSupabase(table, filter = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let subscription

    async function fetchData() {
      try {
        let query = supabase.from(table).select('*')
        
        if (filter) {
          Object.keys(filter).forEach(key => {
            query = query.eq(key, filter[key])
          })
        }

        const { data: initialData, error: fetchError } = await query

        if (fetchError) throw fetchError

        setData(initialData)
        setLoading(false)

        // Set up real-time subscription
        subscription = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? Object.keys(filter).map(key => `${key}=eq.${filter[key]}`).join('&') : undefined
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setData(prev => [...(prev || []), payload.new])
              } else if (payload.eventType === 'UPDATE') {
                setData(prev => prev?.map(item => 
                  item.id === payload.new.id ? payload.new : item
                ))
              } else if (payload.eventType === 'DELETE') {
                setData(prev => prev?.filter(item => item.id !== payload.old.id))
              }
            }
          )
          .subscribe()
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [table, JSON.stringify(filter)])

  return { data, loading, error }
}

